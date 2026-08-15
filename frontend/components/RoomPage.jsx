import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getRoomById,
    getAllRooms,
    getPostsByRoom,
    getMessagesByRoom,
    createPost,
    createMessage,
    getCurrentUser,
    toggellike,
    getComments,
    createComment,
    deleteComment
} from '../api';
import Sidebar from '../components/Sidebar';
import socket from '../Socket';
import './RoomPage.css';

function timeAgo(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function RoomPage() {
    const { room_id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const [room, setRoom] = useState(null);
    const [allRooms, setAllRooms] = useState([]);
    const [feed, setFeed] = useState([]);
    const [error, setError] = useState("");

    // Main Composer States
    const [composerText, setComposerText] = useState("");
    const [attachedFile, setAttachedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Message-Level YouTube-Style Comments States
    const [openMessageId, setOpenMessageId] = useState(null); // Kis message ka comment section khula hai
    const [messageCommentsMap, setMessageCommentsMap] = useState({}); // { [messageId]: [comments array] }
    const [msgReplyText, setMsgReplyText] = useState(""); // Message ke andar comment/reply ka text
    const [activeReplyTargetId, setActiveReplyTargetId] = useState(null); // Kis specific comment ke neeche reply box khula hai

    const getCleanText = (msgData) => {
        if (!msgData) return "No text";
        if (typeof msgData === 'object') {
            return msgData.message || msgData.content || JSON.stringify(msgData);
        }
        if (typeof msgData === 'string' && msgData.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(msgData);
                return parsed.message || parsed.content || msgData;
            } catch (error) {
                return msgData; 
            }
        }
        return msgData;
    };

    const feedEndRef = useRef(null);
    const socketRoomId = `room-${room_id}`;
    
    const handleLike = async (itemId, feedType, currentIsLiked, currentLikesCount) => {
        const idField = feedType === 'post' ? 'post_id' : 'message_id';

        setFeed((prevFeed) =>
            prevFeed.map((item) => {
                if (item[idField] === itemId && item.feed_type === feedType) {
                    return {
                        ...item,
                        is_liked: !currentIsLiked,
                        likes_count: currentIsLiked ? currentLikesCount - 1 : currentLikesCount + 1,
                    };
                }
                return item;
            })
        );

        try {
            const response = await toggellike(feedType, itemId);
            if (!response.success) {
                loadRoomData(); 
            }
        } catch (error) {
            console.error("failed to toggle like", error);
            loadRoomData(); 
        }
    };

    const loadRoomData = async () => {
        try {
            const [roomData, postsData, messagesData] = await Promise.all([
                getRoomById(room_id),
                getPostsByRoom(room_id),
                getMessagesByRoom(room_id),
            ]);

            setRoom(roomData);

            const combined = [
                ...postsData.map((p) => ({ ...p, feed_type: 'post', feed_key: `post-${p.post_id}` })),
                ...messagesData.map((m) => ({ ...m, feed_type: 'message', feed_key: `msg-${m.message_id}` })),
            ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            setFeed(combined);
        } catch (err) {
            console.error("Failed to fetch room data:", err);
            setError("Failed to load room data. Are you logged in?");
        }
    };
// Toggle Message Comments Thread (Polymorphic)
    const toggleMessageComments = async (messageId) => {
        if (openMessageId === messageId) {
            setOpenMessageId(null);
        } else {
            setOpenMessageId(messageId);
            try {
                const commentsData = await getComments('message', messageId);
                setMessageCommentsMap((prev) => ({
                    ...prev,
                    [messageId]: commentsData
                }));
            } catch (err) {
                console.error("Failed to load message comments", err);
            }
        }
    };

    // Send Comment or Reply anchored to a Message
    const handleMessageCommentSubmit = async (messageId, parentCommentId = null) => {
        if (!msgReplyText.trim()) return;
        try {
            await createComment('message', messageId, msgReplyText.trim(), parentCommentId);
            setMsgReplyText("");
            setActiveReplyTargetId(null);
            
            // Refresh comments for this message
            const updatedComments = await getComments('message', messageId);
            setMessageCommentsMap((prev) => ({
                ...prev,
                [messageId]: updatedComments
            }));
        } catch (err) {
            console.error("Failed to post message comment", err);
        }
    };
    useEffect(() => {
        loadRoomData();
        getAllRooms().then(setAllRooms).catch(() => {});
    }, [room_id]);
useEffect(() => {
        socket.emit('join_room', socketRoomId);

        // 1. Sabhi helper functions ko pehle declare karein
        const handleIncomingMessage = (data) => {
            setFeed((prev) => [
                ...prev,
                { ...data, feed_type: 'message', feed_key: `msg-live-${Date.now()}-${Math.random()}` },
            ]);
        };

        const handleLikeUpdated = (data) => {
            setFeed((prevFeed) =>
                prevFeed.map((item) => {
                    const idField = data.target_type === 'post' ? 'post_id' : 'message_id';
                    if (item[idField] === Number(data.target_id) && item.feed_type === data.target_type) {
                        return {
                            ...item,
                            likes_count: data.likes_count,
                        };
                    }
                    return item;
                })
            );
        };

        const handleReceiveComment = (newComment) => {
            const targetId = newComment.target_id;
            if (newComment.target_type === 'message') {
                setMessageCommentsMap((prev) => {
                    if (!prev[targetId]) return prev;
                    return {
                        ...prev,
                        [targetId]: [...prev[targetId], newComment]
                    };
                });
            }
        };

        const handleDeleteCommentSocket = (data) => {
            const { comment_id, target_id, target_type } = data;
            if (target_type === 'message') {
                setMessageCommentsMap((prev) => {
                    if (!prev[target_id]) return prev;
                    return {
                        ...prev,
                        [target_id]: prev[target_id].filter((c) => c.comment_id !== comment_id)
                    };
                });
            }
        };

        // 2. Socket listeners register karein
        socket.on('receive_message', handleIncomingMessage);
        socket.on('like_updated', handleLikeUpdated);
        socket.on('receive_comment', handleReceiveComment);
        socket.on('delete_comment', handleDeleteCommentSocket);

        // 3. Single unified cleanup function
        return () => {
            socket.off('receive_message', handleIncomingMessage);
            socket.off('like_updated', handleLikeUpdated);
            socket.off('receive_comment', handleReceiveComment);
            socket.off('delete_comment', handleDeleteCommentSocket);
        };
    }, [socketRoomId]);
    useEffect(() => {
        if (feedEndRef.current) {
            feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [feed]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1 * 1024 * 1024) {
            setError("File size must be less than 1 MB!");
            e.target.value = null;
            return;
        }

        setError("");
        setAttachedFile(file);
    };

    const handleModernSubmit = async (e) => {
        e.preventDefault();
        if (!composerText.trim() && !attachedFile) return;

        setSubmitting(true);
        try {
            if (attachedFile) {
                const formData = new FormData();
                const postTitle = composerText.trim() ? composerText.slice(0, 30) : "Shared Image";
                const postContent = composerText.trim() ? composerText : ""; 
                
                formData.append('title', postTitle);
                formData.append('content', postContent);
                formData.append('image', attachedFile);

                await createPost(room_id, formData);
            } else {
                await createMessage(room_id, { message: composerText }); 
            }

            setComposerText("");
            setAttachedFile(null);
            if (document.getElementById('modern-file-input')) {
                document.getElementById('modern-file-input').value = '';
            }
            await loadRoomData();
        } catch (err) {
            setError(err.message || "Failed to send");
        } finally {
            setSubmitting(false);
        }
    };
// Delete Comment Handler
    const handleDeleteComment = async (messageId, commentId) => {
        try {
            const response = await deleteComment(commentId);
            if (response.success) {
                // Refresh comments for this message locally
                const updatedComments = await getComments('message', messageId);
                setMessageCommentsMap((prev) => ({
                    ...prev,
                    [messageId]: updatedComments
                }));
            }
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
    };
    const bannerUrl = room?.banner_image_url
        ? `${room.banner_image_url}`
        : null;

    return (
        <div className="rp-shell">
            {/* 1. SIDEBAR */}
            <Sidebar rooms={allRooms} />

            {/* 2. MAIN PAGE */}
            <main className="rp-main">
                
                {/* Banner */}
                <div className="rp-banner" style={bannerUrl.image_url ? { backgroundImage: `url(${bannerUrl.image_url})` } : undefined}>
                    <div className="rp-banner-overlay">
                        <h1 className="rp-banner-title">{room?.room_name || room?.name || 'Room'}</h1>
                        <span className="rp-banner-live"><i className="rp-live-dot" /> live</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="rp-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', padding: '20px', boxSizing: 'border-box', overflow: 'hidden' }}>
                    {error && <p className="rp-error">{error}</p>}

                    {/* TIMELINE SECTION */}
                    <section className="rp-timeline" style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {feed.length === 0 && <p className="rp-empty">Nothing here yet - be the first to post or say hi.</p>}

                        {feed.map((item) => {
                            // ----------------------------------------------------
                            // CHAT MESSAGE ITEM WITH YOUTUBE-STYLE THREADED REPLIES
                            // ----------------------------------------------------
                            if (item.feed_type === 'message') {
                                const isMyMessage = currentUser && item.user_id === currentUser.user_id;
                                const messageClass = isMyMessage ? 'sent' : 'received';
                                const isMsgCommentsOpen = openMessageId === item.message_id;
                                const msgComments = messageCommentsMap[item.message_id] || [];
                                const mainMsgComments = msgComments.filter((c) => !c.parent_comment_id);
                                const getMsgReplies = (parentId) => msgComments.filter((c) => c.parent_comment_id === parentId);

                                return (
                                    <div key={item.feed_key} className={`rp-message-row ${messageClass}`}>
                                        <div className={`rp-chat-bubble ${messageClass}`} style={{ width: '100%', maxWidth: '500px' }}>
                                            <div className="rp-chat-bubble-header">
                                                <span className="rp-chat-bubble-user" style={{ color: isMyMessage ? '#d084ff' : '#b026ff', fontWeight: 'bold' }}>
                                                    {isMyMessage ? 'You' : (item.username || `User ${item.user_id}`)}
                                                </span>
                                            </div>
                                            <p className="rp-chat-bubble-text" style={{ margin: '4px 0', color: '#f1f1f1' }}>
                                                {getCleanText(item.message || item.content)}
                                            </p>                        
                                            <div style={{ alignSelf: 'flex-end', fontSize: '10px', color: '#888', marginTop: '2px' }}>
                                                {timeAgo(item.created_at)}
                                            </div>

                                            {/* Actions: Like & Reply Thread Toggle */}
                                            <div className="rp-chat-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', marginTop: '6px' }}>
                                                <button 
                                                    onClick={() => handleLike(item.message_id, 'message', item.is_liked, item.likes_count)}
                                                    style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}
                                                >
                                                    {item.is_liked ? '❤️' : '<svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#1f1f1f"><path d="m480-120.67-46.67-42q-104.18-95.08-172.25-164.04Q193-395.67 152.67-450.17q-40.34-54.5-56.5-99.16Q80-594 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28 55.34 0 103.34 25.33 48 25.34 83.33 72.67 39.33-49.33 86.33-73.67 47-24.33 100.34-24.33 90.66 0 152 61.28Q880-731.44 880-640q0 46-16.17 90.67-16.16 44.66-56.5 99.16-40.33 54.5-108.41 123.46-68.07 68.96-172.25 164.04l-46.67 42Zm0-88.66q99.49-90.67 163.75-155.5Q708-429.67 745.67-478.17q37.66-48.5 52.66-86.42t15-75.31q0-64.1-41.33-105.77-41.33-41.66-105.18-41.66-50.02 0-92.59 29.83-42.56 29.83-65.56 81.5h-58q-22.34-51-64.9-81.17-42.57-30.16-92.59-30.16-63.85 0-105.18 41.66-41.33 41.67-41.33 105.88 0 37.46 15 75.62 15 38.17 52.66 87Q252-428.33 316.67-363.83q64.66 64.5 163.33 154.5Zm0-289Z"/></svg>'} <span style={{fontSize: '11px'}}>{item.likes_count || 0}</span>
                                                </button>

                                                <button 
                                                    onClick={() => toggleMessageComments(item.message_id)}
                                                    style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: '12px', padding: 0, fontWeight: '600' }}
                                                >
                                                    💬 {isMsgCommentsOpen ? 'Hide replies' : 'Reply thread'}
                                                </button>
                                            </div>

                                            {/* YOUTUBE-STYLE THREADED REPLIES DRAWER UNDER THE MESSAGE */}
                                            {isMsgCommentsOpen && (
                                                <div style={{ marginTop: '10px', borderTop: '1px dashed #444', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    
                                                    {/* Main Comment Input for this Message */}
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Write a comment..." 
                                                            value={msgReplyText}
                                                            onChange={(e) => setMsgReplyText(e.target.value)}
                                                            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px', outline: 'none' }}
                                                        />
                                                        <button 
                                                            onClick={() => handleMessageCommentSubmit(item.message_id, null)}
                                                            style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            Send
                                                        </button>
                                                    </div>

                                                    {/* Comments & Nested Replies Tree */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                                        {mainMsgComments.length === 0 && (
                                                            <p style={{ fontSize: '11px', color: '#777', fontStyle: 'italic' }}>No replies yet.</p>
                                                        )}

                                                        {mainMsgComments.map((comment) => {
                                                            const replies = getMsgReplies(comment.comment_id);
                                                            const isReplyingHere = activeReplyTargetId === comment.comment_id;

                                                            return (
                                                                <div key={comment.comment_id} style={{ background: '#111', padding: '8px 10px', borderRadius: '6px', border: '1px solid #222' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#c084fc', fontWeight: 'bold' }}>
                                                                        <span>{comment.username || 'User'}</span>
                                                                        <span style={{ color: '#555', fontSize: '9px' }}>{timeAgo(comment.created_at)}</span>
                                                                    </div>
                                                                    <p style={{ margin: '3px 0', color: '#ddd', fontSize: '12px' }}>{comment.content}</p>

                                                                    <button 
                                                                        onClick={() => setActiveReplyTargetId(isReplyingHere ? null : comment.comment_id)}
                                                                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '10px', padding: 0, fontWeight: '600' }}
                                                                    >
                                                                        Reply
                                                                    </button>

                                                                    {/* Reply to this specific comment */}
                                                                    {isReplyingHere && (
                                                                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="Reply..." 
                                                                                value={msgReplyText}
                                                                                onChange={(e) => setMsgReplyText(e.target.value)}
                                                                                style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', background: '#080808', border: '1px solid #333', color: '#fff', fontSize: '11px', outline: 'none' }}
                                                                            />
                                                                            <button 
                                                                                onClick={() => handleMessageCommentSubmit(item.message_id, comment.comment_id)}
                                                                                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                                                            >
                                                                                Send
                                                                            </button>
                                                                        </div>
                                                                    )}
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
    <button 
        onClick={() => setActiveReplyTargetId(isReplyingHere ? null : comment.comment_id)}
        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '10px', padding: 0, fontWeight: '600' }}
    >
        Reply
    </button>

    {currentUser && currentUser.user_id === comment.user_id && (
        <button 
            onClick={() => handleDeleteComment(item.message_id, comment.comment_id)}
            style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '10px', padding: 0, fontWeight: '600' }}
        >
            Delete
        </button>
    )}
</div>
                                                                    {/* Indented Nested Replies */}
                                                                    {replies.length > 0 && (
                                                                        <div style={{ marginLeft: '16px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid #333', paddingLeft: '8px' }}>
                                                                            {replies.map((reply) => (
                                                                                <div key={reply.comment_id} style={{ background: '#181818', padding: '6px', borderRadius: '4px' }}>
                                                                                    <div style={{ fontSize: '10px', color: '#c084fc', fontWeight: 'bold' }}>{reply.username || 'User'}</div>
                                                                                    <p style={{ margin: '2px 0', color: '#ccc', fontSize: '11px' }}>{reply.content}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                </div>
                                            )}

                                        </div>
                                    </div>
                                );
                            }

                            // ----------------------------------------------------
                            // POST ITEM (Agar aap posts par bhi same rakhna chahein)
                            // ----------------------------------------------------
                            return (
                                <article
                                    key={item.feed_key}
                                    className="rp-card rp-card-clickable"
                                    onClick={() => navigate(`/post/${item.post_id}`)}
                                >
                                    <div className="rp-card-header">
                                        <div className="rp-avatar">U</div>
                                        <div>
                                            <strong className="rp-username">{item.username || `User ${item.user_id}`}</strong>
                                            <div className="rp-timestamp">{timeAgo(item.created_at)}</div>
                                        </div>
                                    </div>

                                    {item.title && <h4 className="rp-card-title">{item.title}</h4>}
                                    <p className="rp-card-body">{item.content}</p>

                                    {item.image_url && (
                                        <img src={`${item.image_url}`} alt="post" className="rp-card-image" />
                                    )}

                                    <div className="rp-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => handleLike(item.post_id, 'post', item.is_liked, item.likes_count)}
                                                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}
                                            >
                                                {item.is_liked ? '❤️' : '<svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#1f1f1f"><path d="m480-120.67-46.67-42q-104.18-95.08-172.25-164.04Q193-395.67 152.67-450.17q-40.34-54.5-56.5-99.16Q80-594 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28 55.34 0 103.34 25.33 48 25.34 83.33 72.67 39.33-49.33 86.33-73.67 47-24.33 100.34-24.33 90.66 0 152 61.28Q880-731.44 880-640q0 46-16.17 90.67-16.16 44.66-56.5 99.16-40.33 54.5-108.41 123.46-68.07 68.96-172.25 164.04l-46.67 42Zm0-88.66q99.49-90.67 163.75-155.5Q708-429.67 745.67-478.17q37.66-48.5 52.66-86.42t15-75.31q0-64.1-41.33-105.77-41.33-41.66-105.18-41.66-50.02 0-92.59 29.83-42.56 29.83-65.56 81.5h-58q-22.34-51-64.9-81.17-42.57-30.16-92.59-30.16-63.85 0-105.18 41.66-41.33 41.67-41.33 105.88 0 37.46 15 75.62 15 38.17 52.66 87Q252-428.33 316.67-363.83q64.66 64.5 163.33 154.5Zm0-289Z"/></svg>'}
                                            </button>
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                                {item.likes_count || 0} likes
                                            </span>
                                        </div>
                                        <span className="rp-comment-toggle">💬 Open chat</span>
                                    </div>
                                </article>
                            );
                        })}
                        <div ref={feedEndRef} />
                    </section>

                    {/* ROOM CHAT-BAR COMPOSER SECTION */}
                    <section className="rp-composer" style={{ background: '#1a1a1a', padding: '12px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #333', flexShrink: 0 }}>
                        {attachedFile && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2a2a2a', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', color: '#fff' }}>
                                <span>📎 {attachedFile.name}</span>
                                <button 
                                    type="button" 
                                    onClick={() => setAttachedFile(null)}
                                    style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleModernSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                id="modern-file-input"
                                type="file"
                                accept="image/*,.pdf,.txt,.doc"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />

                            <button
                                type="button"
                                onClick={() => document.getElementById('modern-file-input').click()}
                                style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                title="Attach image or file (Max 1MB)"
                            >
                                +
                            </button>

                            <input
                                type="text"
                                placeholder="Message the room or share something..."
                                value={composerText}
                                onChange={(e) => setComposerText(e.target.value)}
                                style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', outline: 'none', padding: '8px' }}
                            />

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 }}
                            >
                                {submitting ? '...' : 'Send'}
                            </button>
                        </form>
                    </section>

                </div>
            </main>
        </div>
    );
}

export default RoomPage;