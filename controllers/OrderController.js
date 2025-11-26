const ProductModal = require("../models/Products");
const CategoriesModal = require("../models/CategoriesModal");
const OrderModal = require("../models/OrderModal");
const Products = require("../models/Products");

async function CreateOrder(req, res) {
  try {
    const { Purchased_Product_List } = req.body;

    for (const item of Purchased_Product_List) {
      const product = await Products.findById(item._id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.name}`,
        });
      }

      // Step 2: Check if product is out of stock
      if (product.stockCount <= 0) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock.`,
        });
      }

      // Step 3: Check if requested qty is more than available
      if (product.stockCount < item.total) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockCount} ${product.unitType} available for ${product.name}.`,
        });
      }
    }

    // Step 4: If all items are valid, reduce stock
    for (const item of Purchased_Product_List) {
      const product = await Products.findById(item._id);
      product.stockCount -= item.total;

      // Pre hook will set inStock automatically
      await product.save();
    }

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
