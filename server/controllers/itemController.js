/*const Item = require('../models/itemModel');
const Price = require('../models/priceModel');
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
  
  const upload = multer({ storage });
  


// Create item with price auto-filled from admin's set price
exports.createItem = [
    upload.single("image"),
    async (req, res) => {
      try {
        const { name, category, quantity, owner } = req.body;
        const priceData = await Price.findOne({ name });
        if (!priceData) return res.status(400).json({ message: `Price for ${name} is not set by admin.` });
  
        const existingItem = await Item.findOne({ name, owner });
        if (existingItem) {
          existingItem.quantity += parseInt(quantity, 10);
          if (req.file) existingItem.imageUrl = `/uploads/${req.file.filename}`;
          await existingItem.save();
          return res.status(200).json(existingItem);
        }
  
        const newItem = new Item({
          name,
          category,
          pricePerKg: priceData.pricePerKg,
          quantity: parseInt(quantity, 10),
          owner,
          imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        });
        await newItem.save();
        res.status(201).json(newItem);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
      }
    },
  ];  
  

// Get all items
exports.getItems = async (req, res) => {
    try {
        const items = await Item.find({}).populate("owner", "name"); // Populates only the 'name' field of the owner
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get items by owner
exports.getItemsByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const items = await Item.find({ owner: ownerId });
        if (items.length === 0) {
            return res.status(404).json({ message: 'No items found for this owner.' });
        }
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


// Delete item by ID
exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Suggest equivalent items based on price
exports.getEquivalentItems = async (req, res) => {
    try {
        console.log("Fetching equivalent items...");
        const { itemId, quantity } = req.params;

        // Find the base item
        const baseItem = await Item.findById(itemId);
        if (!baseItem) return res.status(404).json({ message: 'Item not found' });

        // Fetch price of the base item from Price model
        const basePrice = await Price.findOne({ name: baseItem.name });
        if (!basePrice) return res.status(404).json({ message: 'Price for base item not found' });

        const baseValue = basePrice.pricePerKg * quantity;

        // Fetch all other items
        const allItems = await Item.find({ _id: { $ne: itemId } });

        // For each item, fetch price and calculate equivalent quantity
        const equivalents = await Promise.all(allItems.map(async (item) => {
            const itemPrice = await Price.findOne({ name: item.name });
            const equivalentQuantity = itemPrice ? (baseValue / itemPrice.pricePerKg).toFixed(2) : null;

            return {
                name: item.name,
                category: item.category,
                equivalentQuantity: equivalentQuantity ?? "Price not found"
            };
        }));

        res.status(200).json({ baseItem: baseItem.name, equivalents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};*/
// itemController.js
const Item = require('../models/itemModel');
const Price = require('../models/priceModel');
const multer = require("multer");
const path = require("path");
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// Create or update item with price auto-filled from admin's set price
exports.createOrUpdateItem = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, category, quantity, owner } = req.body;
      const priceData = await Price.findOne({ name });
      if (!priceData) return res.status(400).json({ message: `Price for ${name} is not set by admin.` });

      const existingItem = await Item.findOne({ name, owner });
      if (existingItem) {
        existingItem.quantity += parseInt(quantity, 10);
        if (req.file) {
          if (existingItem.imageUrl) {
            fs.unlink(path.join(__dirname, '..', existingItem.imageUrl), (err) => {
              if (err) console.error('Error deleting image:', err);
            });
          }
          existingItem.imageUrl = `/uploads/${req.file.filename}`;
        }
        await existingItem.save();
        return res.status(200).json(existingItem);
      }

      const newItem = new Item({
        name,
        category,
        pricePerKg: priceData.pricePerKg,
        quantity: parseInt(quantity, 10),
        owner,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      });
      await newItem.save();
      res.status(201).json(newItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
];

// Get all items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({}).populate("owner", "name");
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get items by owner
exports.getItemsByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const items = await Item.find({ owner: ownerId });
    if (items.length === 0) return res.status(404).json({ message: 'No items found for this owner.' });
    res.status(200).json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Update item by ID
exports.updateItem = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, quantity } = req.body;
      const item = await Item.findById(id);
      if (!item) return res.status(404).json({ message: 'Item not found' });

      if (name) item.name = name;
      if (category) item.category = category;
      if (quantity) item.quantity = parseInt(quantity, 10);

      if (req.file) {
        if (item.imageUrl) {
          fs.unlink(path.join(__dirname, '..', item.imageUrl), (err) => {
            if (err) console.error('Error deleting old image:', err);
          });
        }
        item.imageUrl = `/uploads/${req.file.filename}`;
      }

      await item.save();
      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

// Delete item by ID
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.imageUrl) {
      fs.unlink(path.join(__dirname, '..', item.imageUrl), (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suggest equivalent items based on price
exports.getEquivalentItems = async (req, res) => {
  try {
    const { itemId, quantity } = req.params;
    const baseItem = await Item.findById(itemId);
    if (!baseItem) return res.status(404).json({ message: 'Item not found' });

    const basePrice = await Price.findOne({ name: baseItem.name });
    if (!basePrice) return res.status(404).json({ message: 'Price for base item not found' });

    const baseValue = basePrice.pricePerKg * quantity;
    const allItems = await Item.find({ _id: { $ne: itemId } });
    const allPrices = await Price.find({});
    const priceMap = new Map(allPrices.map(p => [p.name, p.pricePerKg]));

    const equivalents = allItems.map((item) => {
      const itemPrice = priceMap.get(item.name);
      return {
        name: item.name,
        category: item.category,
        equivalentQuantity: itemPrice ? (baseValue / itemPrice).toFixed(2) : "Price not found",
      };
    });

    res.status(200).json({ baseItem: baseItem.name, equivalents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



