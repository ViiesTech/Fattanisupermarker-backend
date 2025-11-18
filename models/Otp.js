const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  EmailOrPhone: { type: String },
  Otp: { type: Number },
},{
  timestamps:true
});

module.exports = mongoose.model("Otp", OtpSchema);
