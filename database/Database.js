const mongoose = require('mongoose');
require('dotenv').config();

async function Database() {
  try {
    await mongoose.connect(process.env.MONGO_URI , {
        tlsAllowInvalidHostnames: true  
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
}

module.exports = Database;
