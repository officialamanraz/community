import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById, getComments, createComment, getCurrentUser, getAllRooms } from '../api';
import Sidebar from '../components/Sidebar';
import socket from '../Socket';
import './Postpage.css';

function timeLabel(dateString) {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function PostPage() {
    const { post_id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [error, setError] = useState("");
    const [commentText, setCommentText] = useState("");
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef(null);

    const loadPostData = async () => {
        try {
            // Fixed: was calling getCommentsByPost, which no longer exists -
            // it's now the generic getComments(targetType, targetId).
            const [postData, commentsData] = await Promise.all([
                getPostById(post_id),
                getComments('post', post_id),
            ]);
            setPost(postData);
            setComments(commentsData);
        } catch (err) {
            console.error("Failed to load post:", err);
            setError("Failed to load this post.");
        }
    };

    useEffect(() => {
        loadPostData();
        getAllRooms().then(setAllRooms).catch(() => {});
    }, [post_id]);

    // Real-time: the backend already broadcasts new comments to `room-{room_id}`
    // via req.io when a comment is created (see comment.controller.js), so we
    // just need to join that same room and listen for 'receive_comment' -
    // filtering to only this post's comments, since the room channel carries
    // comments for every post/message in that room, not just this one.
    useEffect(() => {
        if (!post?.room_id) return;

        const socketRoomId = `room-${post.room_id}`;
        socket.emit('join_room', socketRoomId);

        const handleIncoming = (comment) => {
            if (comment.target_type === 'post' && Number(comment.target_id) === Number(post_id)) {
                setComments((prev) => [...prev, comment]);
            }
        };

        socket.on('receive_comment', handleIncoming);

        return () => {
            socket.off('receive_comment', handleIncoming);
        };
    }, [post?.room_id, post_id]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSending(true);
        try {
            // Fixed: new signature is (targetType, targetId, content, parentId).
            // No need to manually emit a socket event here - the backend does
            // that itself after inserting the comment (see comment.controller.js).
            await createComment('post', post_id, commentText);
            setCommentText("");
            // Refresh from the server so we get the real comment_id/created_at
            // rather than faking a local placeholder.
            const data = await getComments('post', post_id);
            setComments(data);
        } catch (err) {
            setError(err.message || "Failed to send");
        } finally {
            setSending(false);
        }
    };

    const bannerUrl = post?.image_url
        ? `${import.meta.env.VITE_API_URL}/uploads/${post.image_url}`
        : null;

    if (!post) {
        return (
            <div className="pp-shell">
                <Sidebar rooms={allRooms} />
                <main className="pp-main"><p className="pp-loading">Loading post...</p></main>
            </div>
        );
    }

    return (
        <div className="pp-shell">
            <Sidebar rooms={allRooms} />

            <main className="pp-main">
                <div className="pp-banner" style={bannerUrl.image_url ? { backgroundImage: `url(${banner.image_url})` } : undefined}>
                    <button className="pp-back" onClick={() => navigate(-1)}>← Back</button>
                    <div className="pp-banner-overlay">
                        <h1 className="pp-banner-title">{post.title || 'Post'}</h1>
                        <p className="pp-banner-sub">by User {post.user_id} · {timeLabel(post.created_at)}</p>
                    </div>
                </div>

                <div className="pp-body">
                    {error && <p className="pp-error">{error}</p>}

                    <p className="pp-post-content">{post.content}</p>

                    <div className="pp-chat-header">💬 Chat about this post</div>

                    <div className="pp-chat-window">
                        {comments.length === 0 && <p className="pp-empty">No messages yet - start the conversation.</p>}
                        {comments.map((c, idx) => {
                            const isMine = currentUser && c.user_id === currentUser.user_id;
                            return (
                                <div key={c.comment_id || `live-${idx}`} className={`pp-bubble-row ${isMine ? 'pp-bubble-row-mine' : ''}`}>
                                    <div className={`pp-bubble ${isMine ? 'pp-bubble-mine' : 'pp-bubble-theirs'}`}>
                                        {!isMine && <span className="pp-bubble-user">{c.username || `User ${c.user_id}`}</span>}
                                        <span className="pp-bubble-text">{c.content}</span>
                                        <span className="pp-bubble-time">{timeLabel(c.created_at)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="pp-chat-input-row">
                        <input
                            type="text"
                            placeholder="Message..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="pp-chat-input"
                        />
                        <button type="submit" disabled={sending} className="pp-send-btn">Send</button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default PostPage;