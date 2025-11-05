// backend/models/food.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FoodSchema = new Schema({
  FoodID: { type: Number, required: true, unique: true },
  UserID: { type: Number, required: true },
  Name: { type: String, required: true, trim: true },
  CaloriesPerUnit: { type: Number, required: true },
  ProteinPerUnit: {type: Number, default: 0},
  CarbsPerUnit: {type: Number, default: 0},
  FatPerUnit: {type: Number, default: 0},
  Unit: { type: String, required: true, trim: true }, // "gram", "oz", "serving", etc.
  UPC: { type: String, default: null }, // Optional: store UPC if scanned
  CreatedAt: { type: Date, default: Date.now }
}, { collection: 'Foods' });

// Index for efficient searching by user and name
FoodSchema.index({ UserID: 1, Name: 1 });

module.exports = mongoose.model('Foods', FoodSchema, 'Foods');