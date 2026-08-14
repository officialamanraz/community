const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../uploads/multer'); 
// Import the new function at the top
const { getBanner, updateBanner, postbanner } = require('../controllers/banner');

router.post('/:page_name', authMiddleware, upload.single('banner_image'), postbanner);

// Get banner (YEH WALI LINE MEIN GALTI THI)
router.get('/:page_name', getBanner); 

// Update existing banner 
router.put('/:page_name', authMiddleware, upload.single('banner_image'), updateBanner);

module.exports = router;