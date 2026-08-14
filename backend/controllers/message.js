const db = require('../database/mysql');

const getMessagesByRoom = async (req, res) => {
    const { room_id } = req.params;
    
    const user_id = req.user?.user_id || null;

    try {
        const [result] = await db.execute(`
SELECT 
    m.*,
    u.username,
    u.name,
    u.email,
    u.profile_image,

    -- Total number of likes on this message
    (
        SELECT COUNT(*)
        FROM likes l
        WHERE l.target_type = "message"
          AND l.target_id = m.message_id
          AND l.is_deleted = 0
    ) AS likes_count,

    -- Did the current logged-in user like this message?
    (
        SELECT COUNT(*)
        FROM likes l
        WHERE l.target_type = "message"
          AND l.target_id = m.message_id
          AND l.user_id = ?
          AND l.is_deleted = 0
    ) > 0 AS is_liked

FROM message m

JOIN users u 
    ON m.user_id = u.user_id

WHERE m.room_id = ?
  AND m.status = "approved"
  AND m.is_deleted = 0

ORDER BY m.created_at ASC`,
            [user_id, room_id]
        );
        res.status(200).json(result);
    } catch (error) {
        console.error('[message] failed to fetch data', error.message);
        return res.status(500).json({
            success: false,
            message: "failed to fetch data"
        });
    }
};

const createMessage = async (req, res) => {
    const { room_id } = req.params;
    const { content } = req.body;
    const user_id = req.user.user_id;
    let image_url = req.file ? req.file.filename : null;
    try {
        const [result] = await db.execute(
            'insert into message (user_id,room_id,content,image_url,status) values(?,?,?,?,?)',
            [user_id, room_id, content, image_url, 'approved']
        );
        res.status(201).json(result);
    } catch (error) {
        console.error('[message] failed to post data', error.message);
        res.status(500).json({
            success: false,
            message: "failed to create the message"
        });
    }
};
const deleteMessage = async (req, res) => {
    const { message_id } = req.params;
    const user_id = req.user.user_id;
    try {
        const [result] = await db.execute(
            'update message set is_deleted=1 where user_id=? and message_id=?',
            [user_id, message_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'not found'
            });
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error('[message] failed to delete this', error.message);
        return res.status(500).json({
            success: false,
            message: "database error"
        });
    }
};
module.exports = { getMessagesByRoom, createMessage, deleteMessage }