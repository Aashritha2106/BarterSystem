
// routes/priceRoutes.js
const express = require('express');
const { setItemPrice, getAllPrices } = require('../controllers/priceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/setPrice', protect, adminOnly, setItemPrice);  // Admin sets price per item
router.get('/allPrices', protect, getAllPrices);             // Get all prices

module.exports = router;

