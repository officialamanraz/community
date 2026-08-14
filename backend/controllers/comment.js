const db = require('../database/mysql');

// Generic - works for both posts and messages via target_type/target_id,
// same polymorphic pattern already used for likes.
const getComments = async (req, res) => {
    const { target_type, target_id } = req.params;
    const user_id = req.user?.user_id || null;

    try {
        const [comments] = await db.execute(
            `SELECT comments.*, users.name AS username, users.email,
                (SELECT COUNT(*) FROM likes WHERE target_type = 'comment' AND target_id = comments.comment_id AND is_deleted = 0) AS likes_count,
                (SELECT COUNT(*) FROM likes WHERE target_type = 'comment' AND target_id = comments.comment_id AND user_id = ? AND is_deleted = 0) > 0 AS is_liked
             FROM comments
             JOIN users ON comments.user_id = users.user_id
             WHERE comments.target_type = ? AND comments.target_id = ? AND comments.is_deleted = 0
             ORDER BY comments.created_at ASC`,
            [user_id, target_type, target_id]
        );
        res.status(200).json(comments);
    } catch (error) {
        console.error('[comment] failed to fetch data', error.message);
        return res.status(500).json({
            success: false,
            message: "failed to fetch data from db"
        });
    }
};

const createComment = async (req, res) => {
    try {
        const { target_type, target_id } = req.params;
        const { content, parent_comment_id } = req.body;
        const user_id = req.user.user_id;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: "Comment content cannot be empty" });
        }

        if (target_type !== 'post' && target_type !== 'message') {
            return res.status(400).json({ success: false, message: "target_type must be 'post' or 'message'" });
        }

        // Figure out which room this belongs to, so we can broadcast to the
        // right socket room - the lookup table depends on what we're
        // commenting on.
        let room_id;
        if (target_type === 'post') {
            const [posts] = await db.execute('SELECT room_id FROM posts WHERE post_id = ?', [target_id]);
            if (posts.length === 0) {
                return res.status(404).json({ success: false, message: "Post not found" });
            }
            room_id = posts[0].room_id;
        } else {
            const [messages] = await db.execute('SELECT room_id FROM message WHERE message_id = ?', [target_id]);
            if (messages.length === 0) {
                return res.status(404).json({ success: false, message: "Message not found" });
            }
            room_id = messages[0].room_id;
        }

        const [insertResult] = await db.execute(
            `INSERT INTO comments (target_type, target_id, user_id, room_id, parent_comment_id, content)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [target_type, target_id, user_id, room_id, parent_comment_id || null, content.trim()]
        );

        const [newCommentRows] = await db.execute(
            `SELECT c.*, u.name AS username
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.comment_id = ?`,
            [insertResult.insertId]
        );

        const createdComment = newCommentRows[0];

        if (req.io && room_id) {
            req.io.to(`room-${room_id}`).emit('receive_comment', createdComment);
        }

        return res.status(201).json({ success: true, comment: createdComment });
    } catch (error) {
        console.error("Create comment error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
const deleteComment = async (req, res) => {
    const { comment_id } = req.params;
    const user_id = req.user.user_id;

    try {
        // 1. Pehle comment fetch karein taaki room_id aur target pata chale
        const [comments] = await db.execute('SELECT * FROM comments WHERE comment_id = ? AND is_deleted = 0', [comment_id]);
        if (comments.length === 0) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }
        const comment = comments[0];

        // 2. Check karein ki delete karne wala user hi owner hai ya nahi
        if (comment.user_id !== user_id) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this comment" });
        }

        // 3. Soft delete query run karein
        await db.execute('UPDATE comments SET is_deleted = 1 WHERE comment_id = ?', [comment_id]);

        // 4. Socket ke zariye room ke sabhi users ko broadcast karein
        if (req.io && comment.room_id) {
            req.io.to(`room-${comment.room_id}`).emit('delete_comment', {
                comment_id: Number(comment_id),
                target_id: comment.target_id,
                target_type: comment.target_type
            });
        }

        res.status(200).json({ success: true, message: "Comment deleted" });
    } catch (error) {
        console.error('[comment] failed to delete this comment', error.message);
        return res.status(500).json({
            success: false,
            message: "failed to delete this comment"
        });
    }
};

module.exports = { getComments, createComment, deleteComment };