const ProductModal = require("../models/Products");
const CategoriesModal = require("../models/CategoriesModal");
const OrderModal = require("../models/OrderModal");

async function CreateOrder(req, res) {
  try {
    const CreateOrder = await OrderModal.create(req.body);
    await CreateOrder.save();

    res.send({
      success: true,
      message: "Order created successfully",
      CreateOrder: CreateOrder,
    });
  } catch (error) {
    console.log("error", error);
  }
}

async function GetMyOrders(req, res) {
  const { UserId } = req.query;

  try {
    const result = await OrderModal.find({ OrderById: UserId }).populate(
      "OrderById",
      "-password"
    ); // ✅ must match schema field name

    res.send({
      success: true,
      message: "All Order fetched",
      data: result,
    });
  } catch (error) {
    console.log("error", error);
  }
}

module.exports = {
  CreateOrder,
  GetMyOrders,
};
