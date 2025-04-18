// models/priceModel.js
const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    pricePerKg: { type: Number, required: true }
});

module.exports = mongoose.model('Price', priceSchema);

