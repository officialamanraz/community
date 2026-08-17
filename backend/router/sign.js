const express = require('express');
const router = express.Router();

// Note: Apne controller file ka exact naam check kar lena, shaayad tune 'auth.js' ya 'signup.js' rakha ho
const { signup, login,resetPassword,forgotPassword } = require('../controllers/signup.js'); 
const upload = require('../uploads/multer'); 
// Jab user yaha POST request bhejega, tab login function chalega aur token return hoga
router.post('/signup',upload.single('profile_image'),signup);
router.post('/login', login); 
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;