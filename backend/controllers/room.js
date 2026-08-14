const db = require('../database/mysql');

const getAllrooms = async (req, res) => {
    try {
        const [rooms] = await db.execute('select * from rooms');
        res.status(200).json(rooms);
    } catch (error) {
        console.error('[ROOMS] failed to fetch ', error);
        return res.status(500).json({
            message: "failed to fetch rooms table data"
        });
    }
};

const getroomById = async (req, res) => {
    // Fixed: was also requiring room_name and room_image_url from req.params,
    // but the route only ever provides room_id - those were always undefined,
    // so the query could never match.
    const { room_id } = req.params;

    try {
        const [rooms] = await db.execute(
            'select * from rooms where room_id=?',
            [room_id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                message: "that room not found"
            });
        }
        res.status(200).json(rooms[0]);
    } catch (error) {
        console.error('[rooms] failed to fetch room', error);
        return res.status(500).json({
            message: "failed to fetch single room from rooms table"
        });
    }
};

const createroom = async (req, res) => {
    try {
        const { room_name } = req.body;
        const image_url = req.file ? req.file.filename : null;

        if (!image_url) {
            return res.status(400).json({
                success: false,
                error: "image is required"
            });
        }

        // room_no is a meaningful serial number (Room #1, #2...) - not auto-generated
        // by MySQL like room_id, so we calculate the next one ourselves.
        const [maxResult] = await db.execute('select MAX(room_no) as maxNo from rooms');
        const nextRoomNo = (maxResult[0].maxNo || 0) + 1;

        const [result] = await db.execute(
            'insert into rooms (room_image_url, room_name, room_no) values(?,?,?)',
            [image_url, room_name, nextRoomNo]
        );

        return res.status(201).json({
            success: true,
            room_id: result.insertId,
            room_no: nextRoomNo
        });

    } catch (error) {
        console.error('[rooms] createroom error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
const updateRoomBanner = async (req, res) => {
    const { room_id } = req.params;
    const banner_image_url = req.file ? req.file.filename : null;

    if (!banner_image_url) {
        return res.status(400).json({
            success: false,
            message: "Banner image is required"
        });
    }

    try {
        const [result] = await db.execute(
            'UPDATE rooms SET banner_image_url = ? WHERE room_id = ?',
            [banner_image_url, room_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        res.status(200).json({
            success: true,
            message: "Room banner updated successfully!"
        });
    } catch (error) {
        console.error('[rooms] failed to update banner:', error.message);
        return res.status(500).json({
            success: false,
            message: "Database error while updating banner"
        });
    }
};

// DON'T FORGET TO EXPORT IT!
module.exports = { getAllrooms, getroomById, createroom, updateRoomBanner };