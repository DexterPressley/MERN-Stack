const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  UserID: { type: Number },                // <-- casing matches your Atlas data
  FirstName: { type: String, required: true },
  LastName:  { type: String, required: true },
  Login:     { type: String, required: true },
  Password:  { type: String, required: true }
});

module.exports = mongoose.model('Users', UserSchema);

