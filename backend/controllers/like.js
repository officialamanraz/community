const db = require('../database/mysql');

const toggleLike = async (req, res) => {
    try {
        const { target_type, target_id } = req.body;
        const user_id = req.user.user_id; // Auth middleware se mila user id

        if (!target_type || !target_id) {
            return res.status(400).json({ success: false, message: "Target type and ID are required" });
        }

        // 1. Check karein ki user ne pehle se like kiya hai ya nahi
        const [existing] = await db.execute(
            'SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
            [user_id, target_type, target_id]
        );

        let isLiked = false;
        if (existing.length > 0) {
            // Agar pehle se like hai, toh remove (unlike) karein
            await db.execute(
                'DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
                [user_id, target_type, target_id]
            );
            isLiked = false;
        } else {
            // Agar like nahi hai, toh insert karein
            await db.execute(
                'INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)',
                [user_id, target_type, target_id]
            );
            isLiked = true;
        }

        // 2. Room ID pata karein (WebSocket broadcasting ke liye)
        let room_id = null;
        if (target_type === 'post') {
            const [posts] = await db.execute('SELECT room_id FROM posts WHERE post_id = ?', [target_id]);
            if (posts.length > 0) room_id = posts[0].room_id;
        } else if (target_type === 'message') {
            const [messages] = await db.execute('SELECT room_id FROM messages WHERE message_id = ?', [target_id]);
            if (messages.length > 0) room_id = messages[0].room_id;
        }

        // 3. Updated total likes count nikalein
        const [countResult] = await db.execute(
            'SELECT COUNT(*) AS total FROM likes WHERE target_type = ? AND target_id = ?', 
            [target_type, target_id]
        );
        const updatedLikesCount = countResult[0].total;

        // 4. WebSocket ke zariye room ke sabhi users ko real-time broadcast karein
        if (req.io && room_id) {
            req.io.to(`room-${room_id}`).emit('like_updated', {
                target_type,
                target_id,
                likes_count: updatedLikesCount
            });
        }

        return res.status(200).json({ 
            success: true, 
            is_liked: isLiked, 
            likes_count: updatedLikesCount 
        });

    } catch (error) {
        console.error("Toggle like error:", error.message);
        return res.status(500).json({ success: false, message: "Database problem", error: error.message });
    }
};

module.exports = { toggleLike };