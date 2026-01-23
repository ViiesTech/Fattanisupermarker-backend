const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    bannerImage: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
