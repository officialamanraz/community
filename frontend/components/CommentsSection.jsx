import React, { useState, useEffect } from 'react';
import { getCommentsByPost, createComment } from '../api';
import socket from '../socket';
import './CommentsSection.css';

function CommentsSection({ postId }) {
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState("");
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyText, setReplyText] = useState("");

    // 1. Fetch comments on load
    const fetchComments = async () => {
        try {
            const data = await getCommentsByPost(postId);
            setComments(data);
        } catch (err) {
            console.error("Failed to load comments", err);
        }
    };

    useEffect(() => {
        fetchComments();

        // Real-time socket sync for this post's comments
        const handleNewComment = (comment) => {
            if (Number(comment.post_id) === Number(postId)) {
                setComments((prev) => [...prev, comment]);
            }
        };

        socket.on('receive_comment', handleNewComment);
        return () => {
            socket.off('receive_comment', handleNewComment);
        };
    }, [postId]);

    // 2. Submit Main Comment
    const handleMainSubmit = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;

        try {
            await createComment(postId, newCommentText.trim(), null);
            setNewCommentText("");
            fetchComments();
        } catch (err) {
            console.error("Failed to post comment", err);
        }
    };

    // 3. Submit Reply to a Comment
    const handleReplySubmit = async (parentCommentId) => {
        if (!replyText.trim()) return;

        try {
            await createComment(postId, replyText.trim(), parentCommentId);
            setReplyText("");
            setActiveReplyId(null);
            fetchComments();
        } catch (err) {
            console.error("Failed to post reply", err);
        }
    };

    // Separate main comments and replies based on parent_comment_id
    const mainComments = comments.filter((c) => !c.parent_comment_id);
    const getReplies = (parentId) => comments.filter((c) => c.parent_comment_id === parentId);

    return (
        <div className="comments-section" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: '15px' }}>Comments ({comments.length})</h3>

            {/* Main Comment Input Box */}
            <form onSubmit={handleMainSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #444', color: '#fff', outline: 'none' }}
                />
                <button type="submit" style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Comment
                </button>
            </form>

            {/* Comments List */}
            <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {mainComments.map((comment) => {
                    const replies = getReplies(comment.comment_id);

                    return (
                        <div key={comment.comment_id} className="comment-item" style={{ background: '#151515', padding: '14px', borderRadius: '10px', border: '1px solid #262626' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#a855f7', fontWeight: 'bold', marginBottom: '6px' }}>
                                <span>{comment.username || 'User'}</span>
                                <span style={{ color: '#666', fontSize: '11px' }}>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p style={{ margin: '6px 0', color: '#e5e5e5', fontSize: '14px' }}>{comment.content}</p>
                            
                            <button 
                                onClick={() => setActiveReplyId(activeReplyId === comment.comment_id ? null : comment.comment_id)}
                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px', padding: 0, marginTop: '6px', fontWeight: '600' }}
                            >
                                Reply
                            </button>

                            {/* Reply Input Box */}
                            {activeReplyId === comment.comment_id && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder={`Reply to ${comment.username || 'User'}...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '13px', outline: 'none' }}
                                    />
                                    <button 
                                        onClick={() => handleReplySubmit(comment.comment_id)}
                                        style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Reply
                                    </button>
                                </div>
                            )}

                            {/* Nested Replies (Indented like YouTube threads) */}
                            {replies.length > 0 && (
                                <div className="replies-list" style={{ marginLeft: '24px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '2px solid #333', paddingLeft: '14px' }}>
                                    {replies.map((reply) => (
                                        <div key={reply.comment_id} className="reply-item" style={{ background: '#1c1c1c', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '12px', color: '#c084fc', fontWeight: 'bold', marginBottom: '2px' }}>{reply.username || 'User'}</div>
                                            <p style={{ margin: '2px 0', color: '#d4d4d4', fontSize: '13px' }}>{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CommentsSection;