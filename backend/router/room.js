const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const upload = require('../uploads/multer');  // ya jo bhi tera multer file ka naam hai
const {getAllrooms,getroomById,createroom,updateRoomBanner}=require('../controllers/room.js');

router.get('/',getAllrooms);
router.get('/:room_id',authMiddleware,getroomById)
router.post('/', authMiddleware, isAdmin, upload.single('image'), createroom);
router.put('/:room_id/banner', authMiddleware, upload.single('banner_image'), updateRoomBanner);
module.exports=router