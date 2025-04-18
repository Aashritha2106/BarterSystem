
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    pricePerKg: { type: Number, required: true },
    quantity: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,required: true },
    imageUrl: { type: String }, // New field for image URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);


