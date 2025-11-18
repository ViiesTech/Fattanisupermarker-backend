const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true },
  password: { type: String },
  phone: { type: String },
  FCMToken: { type: String },
  isDeleted: { type: Boolean, default: false },
},{
  timestamps:true
});

module.exports = mongoose.model("User", UserSchema);
