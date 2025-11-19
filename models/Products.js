const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number },
  productImage: { type: String },
  parentCategory: String,
  subCategory: String,
  unitType: {
    type: String, required: true,
    enum: ["piece", "kg", "g", "litre", "ml", "dozen"],
  },
  unitValue: { type: Number, required: true },
  stockCount: { type: Number, default: 0 },
  inStock: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, {
  timestamps: true
});

productSchema.pre('save', function (next) {
  this.inStock = this.stockCount > 0;
  next();
});

module.exports = mongoose.model('Product', productSchema);
