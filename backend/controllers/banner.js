const db = require('../database/mysql');

const getBanner = async (req, res) => {
    const { page_name } = req.params;

    try {
        const [banners] = await db.execute(
            "SELECT image_url FROM banners WHERE page_name = ?",
            [page_name]
        );

        if (banners.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: banners[0]
        });

    } catch (error) {
        console.error("[Banner] Failed to fetch:", error.message);

        return res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
};

const postbanner = async (req, res) => {
    const { page_name } = req.params;
    const image_url = req.file ? req.file.filename : null;

    try {
        if (!image_url) {
            return res.status(400).json({ success: false, message: "Please upload an image" });
        }

        // SMART SQL (UPSERT): Naya hai toh Insert karo, Purana hai toh Update karo!
        const [post] = await db.execute(
            "INSERT INTO banners (page_name, image_url) VALUES (?, ?) ON DUPLICATE KEY UPDATE image_url = ?",
            [page_name, image_url, image_url]
        );

        return res.status(201).json({ success: true, message: "Banner saved successfully" });

    } catch (error) {
        // Ye error tumhare backend terminal me print hoga
        console.error("[Banner] Failed to post:", error.message);
        res.status(500).json({
            success: false,
            message: "Database problem"
        });
    }
};

// Update Banner
const updateBanner = async (req, res) => {
    const { page_name } = req.params;
    const image_url = req.file ? req.file.filename : null;

    try {

        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: "Please upload a banner image"
            });
        }

        const [result] = await db.execute(
            "UPDATE banners SET image_url = ? WHERE page_name = ?",
            [image_url, page_name]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Banner updated successfully"
        });

    } catch (error) {
        console.error("[Banner] Failed to update:", error.message);

        return res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
};

module.exports = {
    getBanner,
    updateBanner,postbanner
};