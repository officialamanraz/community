const express = require('express');
const router = express.Router();const authMiddleware = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

const { createReport, getAllReports}=require('../controllers/report.js');


router.post('/', createReport);
router.get('/', isAdmin,getAllReports);

module.exports=router;