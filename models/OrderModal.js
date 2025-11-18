const mongoose = require("mongoose");

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
    enum: ["New_Order", "Pending", "Dispatched", "Delivered", "Canceled"],
    default: "New_Order",
    required: true,
  },
},{
    timestamps:true
});

module.exports = mongoose.model("Order", OrderSchema);
