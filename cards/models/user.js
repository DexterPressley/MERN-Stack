const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  UserID: {type: Number, required: true, unique: true},
  FirstName: {type: String, required: true},
  LastName: {type: String, required: true},
  Email: {type: String, required: true, unique: true, lowercase: true, trim: true},
  Login: { type: String, required: true },
  Password: {type: String, required: true },
  IsVerified: {type: Boolean, default: false},
  VerificationToken: {type: String, default: null},
  ResetPasswordToken: {type: String, default: null},
  ResetPasswordExpires: {type: Date, default: null},
  CreatedAt: {type: Date, default: Date.now}
}, { collection: 'Users' });

module.exports = mongoose.model('Users', UserSchema, 'Users');

