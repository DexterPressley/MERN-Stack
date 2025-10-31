// backend/models/day.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EntrySchema = new Schema({
  FoodID: { type: Number, required: true },
  Amount: { type: Number, required: true }, // Quantity of the unit
  MealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    required: true
  },
  Timestamp: { type: Date, default: Date.now }
}, { _id: true }); // Keep _id for easy entry identification within array

const DaySchema = new Schema({
  DayID: { type: Number, required: true, unique: true },
  UserID: { type: Number, required: true },
  Date: { type: Date, required: true }, // Calendar date (e.g., 2025-10-29)
  Entries: [EntrySchema],
  CreatedAt: { type: Date, default: Date.now }
}, { collection: 'Days' });

// Compound index for efficient queries by user and date
DaySchema.index({ UserID: 1, Date: 1 }, { unique: true });

module.exports = mongoose.model('Days', DaySchema, 'Days');