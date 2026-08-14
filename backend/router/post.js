const express = require('express');
const router = express.Router();

// Controllers require kar rahe hain
const { getPostsByRoom, getPostsById, createPost, deletePost, getAllPostsAdmin } = require('../controllers/post');

// Middlewares require kar rahe hain
const authMiddleware = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const upload = require('../uploads/multer'); // Agar file ka naam multer.js hai toh

// ==============================
// PUBLIC ROUTES (Bina login ke dekh sakte hain)
// ==============================
router.get('/room/:room_id',authMiddleware, getPostsByRoom);
router.get('/:post_id',authMiddleware, getPostsById);

// ==============================
// PROTECTED ROUTES (Login zaroori hai)
// ==============================
// createPost mein authMiddleware aur upload (multer) dono chalenge
router.post('/:room_id', authMiddleware, upload.single('image'), createPost);

// deletePost mein sirf authMiddleware chalega
router.delete('/:post_id/:user_id', authMiddleware, deletePost);

// ==============================
// ADMIN ROUTES (Sirf admin ke liye)
// ==============================
router.get('/admin/all', authMiddleware, isAdmin, getAllPostsAdmin);

module.exports = router;