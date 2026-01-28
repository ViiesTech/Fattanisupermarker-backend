const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true },
  password: { type: String },
  phone: { type: String },
  FCMToken: { type: String },
  isDeleted: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true },
  isGoogleUser: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "pos", "admin"], default: "user" },
  posUsername: { type: String, unique: true, sparse: true },
}, {
  timestamps: true
});

module.exports = mongoose.model("User", UserSchema);

