
// itemRoutes.js
const express = require('express');
const {
  createOrUpdateItem,
  getItems,
  getItemsByOwner,
  updateItem,
  deleteItem,
  getEquivalentItems,
} = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createOrUpdateItem); // Create or update item
router.get('/', getItems); // Get all items
router.get('/equivalent/:itemId/:quantity', protect, getEquivalentItems); // Get equivalent items
router.get('/owner/:ownerId', protect, getItemsByOwner); // Get items by owner
router.put('/:id', protect, updateItem); // Update item by ID
router.delete('/:id', protect, deleteItem); // Delete item by ID

module.exports = router;

