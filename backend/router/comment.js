const express = require('express');
const router = express.Router();
const { getComments, createComment, deleteComment } = require('../controllers/comment');
const authMiddleware = require('../middleware/authMiddleware');

// Generic routes - :target_type is 'post' or 'message', :target_id is that
// post's or message's id. Same pattern as the /likes route.
router.get('/:target_type/:target_id', getComments);
router.post('/:target_type/:target_id', authMiddleware, createComment);
router.delete('/:comment_id', authMiddleware, deleteComment);

module.exports = router;