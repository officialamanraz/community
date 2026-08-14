const express = require('express');
const router = express.Router();
const { getprofile, updateprofile, toggelprofile,getUserPosts } = require('../controllers/profile');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../uploads/multer'); 

router.get('/:user_id',authMiddleware,getprofile);
router.put('/:user_id',authMiddleware,upload.fields([
    {name:'profile_image', maxCount:1},
    {name:'banner_image',maxCount:1}
]),updateprofile)
router.post('/follow/:following_id',authMiddleware, toggelprofile);
router.get('/:user_id/posts', authMiddleware, getUserPosts);

module.exports = router;