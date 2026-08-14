const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/mysql');

const jwt_secret = process.env.JWT_SECRET;
const jwt_expires_in = process.env.JWT_EXPIRES_IN;
const bcrypt_salt_rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

const generateToken = (user_id, role) => {
    return jwt.sign({ user_id, role }, jwt_secret, { expiresIn: jwt_expires_in });
};

const signup = async (req, res) => {
    console.log("BODY DATA:", req.body);
    console.log("FILE DATA:", req.file);
    try {
        // 1. Frontend se plain text 'password' nikalein (password_hash nahi)
        const { name, email, phone, password } = req.body;
        
        let profile_image = null;
        if (req.file) {
            profile_image = req.file.filename; 
        }

        // 2. Missing fields check karein
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Required fields missing" });
        }

        // 3. Password ko bcrypt se hash karein
        const hashedPassword = await bcrypt.hash(password, bcrypt_salt_rounds);

        // 4. Database mein user ko insert karein (password_hash column mein hashed password jayega)
        const query = "INSERT INTO users (name, email, phone, password_hash, profile_image) VALUES (?, ?, ?, ?, ?)";
        
        const [insertResult] = await db.execute(query, [name, email, phone, hashedPassword, profile_image]);

        // 5. Token generate karein taaki signup ke baad direct login ho jaye agar chahein
        const token = generateToken(insertResult.insertId, 'user');

        return res.status(201).json({ 
            success: true, 
            message: "Account created successfully!",
            token: token,
            user: {
                user_id: insertResult.insertId,
                name: name,
                role: 'user'
            }
        });

    } catch (error) {
        console.error("Signup backend error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "server error while creating account",
            error: error.message 
        });
    }
};

const login = async (req, res) => {
    // Fix: Destructure 'password' instead of 'password_hash' from req.body
    const { email, password } = req.body;
    console.log(`[auth] login attempt - email:${email}`);

    if (!email || !password) {
        console.warn('[auth] login failed - missing email or password');
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    try {
        const [result] = await db.execute('select * from users where email = ?', [email]);

        if (result.length === 0) {
            console.warn(`[auth] login failed - no account for ${email}`);
            return res.status(404).json({
                success: false,
                message: 'no account found with this email'
            });
        }

        const user = result[0];
        if (!user.password_hash) {
            console.error(`[auth] login failed - user has no password_hash set`);
            return res.status(500).json({ success: false, message: 'account configuration error' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "wrong password"
            });
        }

        const token = generateToken(user.user_id, user.role);
        console.log(`[auth] login success - user_id: ${user.user_id}, role:${user.role}`);

        res.status(200).json({
            success: true,
            message: "login successful",
            token: token,
            user: { user_id: user.user_id, name: user.name, role: user.role }
        });
    } catch (error) {
        console.error(`[auth] login error for ${email}:`, error.message);
        return res.status(500).json({
            success: false,
            message: "failed to fetch data"
        });
    }
};

module.exports = { signup, login };