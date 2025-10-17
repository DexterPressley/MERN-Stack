const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  UserID: { type: Number },
  FirstName: { type: String, required: true },
  LastName:  { type: String, required: true },
  Login:     { type: String, required: true },
  Password:  { type: String, required: true }
}, { collection: 'Users' });

module.exports = mongoose.model('Users', UserSchema, 'Users');

