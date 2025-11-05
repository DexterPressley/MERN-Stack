// backend/models/user.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  UserID: { type: Number, required: true, unique: true },
  FirstName: { type: String, required: true },
  LastName: { type: String, required: true },
  Email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  Username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  Password: { type: String, required: true },
  IsVerified: { type: Boolean, default: false },
  VerificationToken: { type: String, default: null },
  VerificationTokenExpires: { type: Date, default: null },
  ResetPasswordToken: { type: String, default: null },
  ResetPasswordExpires: { type: Date, default: null },
  CalorieGoal: { type: Number, default: 2000 },
  ProteinGoal: { type: Number, default: 100 },
  CarbsGoal: { type: Number, default: 100 },
  FatGoal: { type: Number, default: 100 },
  DayRolloverTime: { type: String, default: "00:00" }, // Format: "HH:MM" (24-hour)
  CreatedAt: { type: Date, default: Date.now }
}, { collection: 'Users' });

module.exports = mongoose.model('Users', UserSchema, 'Users');