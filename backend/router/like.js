const express = require('express');
const router = express.Router();
const { toggleLike } = require('../controllers/like');
const  authMiddleware = require('../middleware/authMiddleware'); // Your existing auth check

// POST /api/likes -> Handles both like and unlike via toggle
router.post('/',authMiddleware, toggleLike);

module.exports = router;