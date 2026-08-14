const express=require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {getMessagesByRoom, createMessage ,deleteMessage}=require('../controllers/message.js');

router.get('/:room_id',authMiddleware, getMessagesByRoom);
router.post('/:room_id', authMiddleware, createMessage);
router.delete('/:message_id/:user_id',deleteMessage);

module.exports=router