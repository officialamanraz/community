const db = require('../database/mysql');

const getPostsByRoom = async (req, res) => {
    const { room_id } = req.params;
    const user_id = req.user?.user_id || null;

    try {
        const [posts] = await db.execute(
           `SELECT posts.*, users.name, users.email,
                (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = posts.post_id AND is_deleted = 0) AS likes_count,
                (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = posts.post_id AND user_id = ? AND is_deleted = 0) > 0 AS is_liked
             FROM posts
             JOIN users ON posts.user_id = users.user_id
             WHERE posts.room_id = ? AND posts.status = 'approved' AND posts.is_deleted = 0
             ORDER BY posts.created_at ASC`,
            [user_id, room_id]
        );
        res.status(200).json(posts);
    } catch (error) {
        console.error('[POST] Failed to fetch data', error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch data"
        });
    }
};

const getPostsById = async (req, res) => {
    const { post_id } = req.params;

    try {
        const [result] = await db.execute(
            'SELECT * FROM posts WHERE post_id=? AND status="approved" AND is_deleted=0',
            [post_id]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error('[POST] Failed to fetch post', error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch post"
        });
    }
};

const createPost = async (req, res) => {
    const { room_id } = req.params;
    const { title, content } = req.body;
    const user_id = req.user.user_id;
    let image_url = req.file ? req.file.filename : null;
    const postTitle = title && title.trim() !== ""? title : (content ? content.slice(0,30) + "..." : "shared Media")

    try {
        const [post] = await db.execute(
            'insert into posts (room_id,user_id,image_url,title,content,status) values(?,?,?,?,?,?)',
            [room_id, user_id, image_url, title, content||"", 'approved']
        );
        res.status(201).json({ message: "Post created successfully" });
    } catch (error) {
        console.error('[POST] Failed to create post', error.message);
        res.status(500).json({ message: "Failed to create post" });
    }
};

const deletePost = async (req, res) => {
    const { post_id } = req.params;
    const user_id = req.user.user_id;
    try {
        const [result] = await db.execute(
            'UPDATE posts SET is_deleted=1 WHERE post_id=? AND user_id=?',
            [post_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Post not found or you don't own this post"
            });
        }

        res.status(200).json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
        console.error('[POST] Failed to delete post', error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete post"
        });
    }
};

const getAllPostsAdmin = async (req, res) => {
    try {
        const [result] = await db.execute(
            `SELECT posts.*, users.name, users.email
             FROM posts
             JOIN users ON posts.user_id = users.user_id
             ORDER BY posts.created_at DESC`
        );
        res.status(200).json(result);
    } catch (error) {
        console.error('[POST] Failed to fetch admin posts', error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch posts for admin"
        });
    }
};

module.exports = { getPostsByRoom, getPostsById, createPost, deletePost, getAllPostsAdmin };