const db = require('../database/mysql');

// 1. Get Profile
const getprofile = async (req, res) => {
    const { user_id } = req.params;
    try {
      const query = `
            SELECT 
                u.*, 
                (SELECT COUNT(*) FROM follows WHERE following_id = u.user_id) AS followers,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.user_id) AS following,
                b.image_url AS banner_image
            FROM users u
            LEFT JOIN banners b ON u.user_id = b.user_id
            WHERE u.user_id = ?
        `;  
        const [profile] = await db.execute(query, [user_id]);
        
        if (profile.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Return the first object in the array
        return res.status(200).json(profile[0]);
        
    } catch (error) {
        console.error(`[profile] cant fetch data for user ${user_id}`, error.message);
        return res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
};

// // 2. Update Profile
const updateprofile = async (req, res) => {
    console.log("REQQ FILES:", req.files);
    console.log("REQQ BODY:", req.body);
    
    const user_id = req.user.user_id; 
    const { bio, username } = req.body;
    
    let profile_image = null;
    let bannerimage = null;  

    try {
        // Files check aur correct variable assignment
        if (req.files && req.files['profile_image']) {
            profile_image = req.files['profile_image'][0].filename;
        }
        if (req.files && req.files['banner_image']) {
            bannerimage = req.files['banner_image'][0].filename;
        }

        let updateQuery;
        let queryParams;

        // If user uploaded a new profile image
        if (profile_image) {
            console.log("CURRENT USER ID IS:", user_id);
            updateQuery = 'UPDATE users SET bio=?, profile_image=?, username=? WHERE user_id=?';
            queryParams = [bio, profile_image, username, user_id];
        } 
        // If no new profile image, keep old image safe
        else {
            console.log("CURRENT USER ID IS:", user_id);
            updateQuery = 'UPDATE users SET bio=?, username=? WHERE user_id=?';
            queryParams = [bio, username, user_id];
        }

        const [update] = await db.execute(updateQuery, queryParams);

        // Banner image update / insert logic
        if (bannerimage) {
            const bannerquery = `
                INSERT INTO banners (user_id, page_name, image_url) 
                VALUES (?, 'profile', ?) 
                ON DUPLICATE KEY UPDATE image_url = ?
            `;
            // Yahan user_id, phir 'profile' (page_name ke liye), aur phir bannerimage do baar pass hoga
            await db.execute(bannerquery, [user_id, bannerimage, bannerimage]);
        
        }
        
        if (update.affectedRows === 0 && !bannerimage) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
        });
        
    } catch (error) {
        console.error(`[profile] failed to update for user ${user_id}`, error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile data"
        });
    }
};
// 3. Toggle Follow/Unfollow
const toggelprofile = async (req, res) => {
    // Get the current logged-in user's ID
    const follower_id = req.user.user_id; 
    
    // Usually, you pass the target ID in the URL params (e.g., /follow/5)
    const { following_id } = req.params; 
    
    if (following_id == follower_id) {
        return res.status(403).json({
            success: false,
            message: "You cannot follow yourself"
        });
    }
    
    try {
        // Corrected SQL syntax (used AND instead of a comma)
        const [profilecheck] = await db.execute(
            'SELECT * FROM follows WHERE following_id=? AND follower_id=?', 
            [following_id, follower_id]
        );
        
        if (profilecheck.length > 0) {
            // Already following -> Unfollow (Delete)
            await db.execute(
                'DELETE FROM follows WHERE following_id=? AND follower_id=?', 
                [following_id, follower_id]
            );
            return res.status(200).json({ success: true, message: "Unfollowed successfully", isFollowing: false });
        } else {
            // Not following -> Follow (Insert)
            await db.execute(
                'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', 
                [follower_id, following_id]
            );
            return res.status(201).json({ success: true, message: "Followed successfully", isFollowing: true });
        }
        
    } catch (error) {
        console.error(`[profile] failed to toggle follow status`, error.message);
        return res.status(500).json({
            success: false,
            message: "Database error while toggling follow"
        });
    }
};
// Function to get a user's posts
const getUserPosts = async (req, res) => {
    const { user_id } = req.params;
    try {
        // Fetch posts created by this user, newest first
        const [posts] = await db.execute(
            'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC',
            [user_id]
        );
        return res.status(200).json(posts);
    } catch (error) {
        console.error(`[profile] failed to fetch posts for user ${user_id}`, error.message);
        return res.status(500).json({ success: false, message: "Database error" });
    }
};

module.exports = { getprofile, updateprofile, toggelprofile,getUserPosts };