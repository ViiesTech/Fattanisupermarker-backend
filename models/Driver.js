const mongoose = require("mongoose");
const DRIVER_STATUSES = require("../constants/driverStatus");

const DriverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    address: { type: String, required: true },
    cnicNumber: { type: String, required: true },
    cnicFront: { type: String, required: true },
    cnicBack: { type: String, required: true },
    status: { type: String, enum: DRIVER_STATUSES, default: "active" },
    deliveries: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Driver", DriverSchema);
