// controllers/priceController.js
const Price = require('../models/priceModel');
const Item = require('../models/itemModel');

// 🌟 Set or update price for a specific item
exports.setItemPrice = async (req, res) => {
    try {
        const { name, pricePerKg } = req.body;

        if (!name || !pricePerKg) {
            return res.status(400).json({ message: "Name and pricePerKg are required." });
        }

        // ✅ Update or create price for the specific item (without category)
        const updatedPrice = await Price.findOneAndUpdate(
            { name },
            { pricePerKg },
            { new: true, upsert: true }
        );

        // ⚡ Update existing items with the new price
        await Item.updateMany(
            { name },
            { $set: { pricePerKg: pricePerKg } }
        );

        res.status(200).json({
            message: `Price for ${name} set to ${pricePerKg} successfully.`,
            updatedPrice
        });
    } catch (error) {
        console.error("Error setting item price:", error);
        res.status(500).json({ message: error.message });
    }
};


// 🌟 Get all prices set by admin
exports.getAllPrices = async (req, res) => {
    try {
        const prices = await Price.find({});
        res.status(200).json(prices);
    } catch (error) {
        console.error("Error fetching prices:", error);
        res.status(500).json({ message: error.message });
    }
};


