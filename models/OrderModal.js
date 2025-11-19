const mongoose = require("mongoose");
const ORDER_STATUSES = require("../constants/orderStatus");

const OrderSchema = new mongoose.Schema({
  OrderById: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  Address: {
    type: String,
  },
  Purchased_Product_List: {
    type: Array,
  },
  Subtotal: {
    type: Number,
  },
  discount: {
    type: String,
  },
  Anydiscount: {
    type: Boolean,
  },
  Total_Price: {
    type: Number,
  },
  Delivery_Charges: {
    type: Number,
  },
  Order_Status: {
    type: String,
    enum: ORDER_STATUSES,
    default: "New_Order",
    required: true,
  },
  assignedTo: { type: mongoose.Schema.ObjectId, ref: "Driver", default: null },
  deliveryDate: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model("Order", OrderSchema);
