const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardSchema = new Schema({
  UserID: { type: Number },                // <-- casing matches
  Card:   { type: String, required: true }
});

module.exports = mongoose.model('Cards', CardSchema);

