const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardSchema = new Schema({
  UserID: { type: Number },
  Card:   { type: String, required: true }
}, { collection: 'Cards' }); // Force exact collection name

module.exports = mongoose.model('Cards', CardSchema, 'Cards');

