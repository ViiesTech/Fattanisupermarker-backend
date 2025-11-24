const upload = require("../middleware/multer");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const Products = require("../models/Products");
const CategoriesModal = require("../models/CategoriesModal");
const { deleteCloudinaryImageFromUrl, uploadImageInCloudinary } = require("../functions/cloudinaryHelper");
const OrderModal = require("../models/OrderModal");
const DriverSchema = require('../models/Driver')
const ORDER_STATUSES = require("../constants/orderStatus");
const DRIVER_STATUSES = require("../constants/driverStatus");
const Users = require("../models/Users");
const bcrypt = require('bcryptjs')
const JWT = require("jsonwebtoken");
require("dotenv").config();

const cloudinary_folder = "Fattanisupermarket/Images"
const cloudinary_product_folder = "Fattanisupermarket/Product";
const cloudinary_category_folder = "Fattanisupermarket/Category";
const cloudinary_cnic_folder = "Fattanisupermarket/Cnic";

async function uploadImage(req, res) {
  try {
    upload.single("image")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error(err);
        return res.status(400).json({
          success: false,
          message: "Multer error",
          error: err.message,
        });
      } else if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
          error: err.message,
        });
      }

      if (!req.file) {
        return res.json({ success: false, message: "*image required." });
      }

      const uploadedFile = req.file;
      cloudinary.uploader.upload(
        `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString(
          "base64"
        )}`,
        {
          resource_type: "auto",
          folder: cloudinary_folder,
        },
        (cloudinaryErr, cloudinaryResult) => {
          if (cloudinaryErr) {
            console.error(cloudinaryErr);
            return res.status(500).json({
              success: false, message: "Cloudinary error", error: cloudinaryErr.message,
            });
          }

          return res.json({
            success: true, message: "Image uploaded successfully", url: cloudinaryResult.secure_url,
          });
        }
      );
    });
  } catch (error) {
    return res.status(400).json({
      message: "Something went wrong", success: false, error: error.message,
    });
  }
}

async function addProduct(req, res) {
  try {
    const { name, category, price, productImage, parentCategory, subCategory, unitType, unitValue, stockCount } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!category) return res.status(400).json({ success: false, message: 'Category is required' });
    if (!price) return res.status(400).json({ success: false, message: 'Price is required' });
    if (!parentCategory) return res.status(400).json({ success: false, message: 'Product image is required' });
    if (!subCategory) return res.status(400).json({ success: false, message: 'Product image is required' });
    if (!productImage && !req.file)
      return res.status(400).json({ success: false, message: 'Product image is required' });

    let finalImageUrl = productImage;

    if (req.file) {
      finalImageUrl = await uploadImageInCloudinary(req.file, cloudinary_product_folder);
    }

    const newProduct = await Products.create({
      name, category, price, parentCategory, subCategory, productImage: finalImageUrl,
      unitType: unitType || "", unitValue: unitValue || 0, stockCount: stockCount || 0,
      inStock: (stockCount && stockCount > 0) ? true : false
    })
    await newProduct.populate("category");
    return res.status(200).json({ success: true, message: 'Product added successfully', product: newProduct })
  } catch (error) {
    return res.status(400).json({
      message: "Something went wrong", success: false, error: error.message,
    });
  }
}
async function updateProduct(req, res) {
  try {
    const { productId } = req.params;
    const { name, category, price, productImage, parentCategory, subCategory, unitType, unitValue, stockCount, status } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

    const product = await Products.findById(productId);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (name) product.name = name;
    if (category) product.category = category;
    if (price) product.price = price;
    if (parentCategory) product.parentCategory = parentCategory;
    if (subCategory) product.subCategory = subCategory;
    if (unitType) product.unitType = unitType;
    if (unitValue !== undefined) product.unitValue = unitValue;
    if (stockCount !== undefined) product.stockCount = stockCount
    if (status) product.status = status;

    if (productImage) {
      if (product.productImage) {
        await deleteCloudinaryImageFromUrl(product.productImage);
      }
      product.productImage = productImage;
    }

    if (req.file) {
      if (product.productImage) {
        await deleteCloudinaryImageFromUrl(product.productImage);
      }
      product.productImage = await uploadImageInCloudinary(req.file, cloudinary_product_folder);
    }

    const updatedProduct = await product.save();
    await updatedProduct.populate("category");

    return res.status(200).json({ success: true, message: 'Product updated successfully', product: updatedProduct });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
}
async function deleteProduct(req, res) {
  try {
    const { productId } = req.params;

    if (!productId)
      return res.status(400).json({ success: false, message: 'Product ID is required' });

    const product = await Products.findById(productId);

    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.productImage) {
      await deleteCloudinaryImageFromUrl(product.productImage);
    }

    await Products.findByIdAndDelete(productId);

    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
}

async function getAllProducts(req, res) {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    let query = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query = {
        $or: [
          { name: regex },
        ],
      };
    }

    const productsAggregate = await Products.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          paginatedResults: [
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ],
          activeCount: [
            { $match: { status: "active" } },
            { $count: "count" }
          ],
          inactiveCount: [
            { $match: { status: "inactive" } },
            { $count: "count" }
          ],
          outOfStock: [
            { $match: { $or: [{ inStock: false }, { stockCount: 0 }] } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const products = productsAggregate[0].paginatedResults;
    const totalProducts = productsAggregate[0].totalCount[0]?.count || 0;
    const activeProducts = productsAggregate[0].activeCount[0]?.count || 0;
    const inactiveProducts = productsAggregate[0].inactiveCount[0]?.count || 0;
    const outOfStock = productsAggregate[0].outOfStock[0]?.count || 0

    return res.status(200).json({
      success: true, message: 'All products', products,
      currentPage: page, totalPages: Math.ceil(totalProducts / limit),
      summary: {
        totalProducts, activeProducts, inactiveProducts, outOfStock,
      }
    })
  } catch (error) {
    return res.status(400).json({
      message: "Something went wrong", success: false, error: error.message,
    });
  }
}

async function addCategory(req, res) {
  try {
    let { category, categoryImage, subcategories } = req.body;

    if (!category) return res.status(400).json({ success: false, message: 'Category name is required' });
    if (!categoryImage &&
      !req.file) return res.status(400).json({ success: false, message: 'Category image is required' });

    if (typeof subcategories === "string") {
      try {
        subcategories = JSON.parse(subcategories);
      } catch (err) {
        subcategories = req.body.subcategories
          ? [].concat(req.body.subcategories)
          : [];
      }
    }

    if (!subcategories || !Array.isArray(subcategories) || subcategories.length === 0) {
      return res.status(400).json({ success: false, message: "At least one subcategory is required" });
    }

    let finalImageUrl = categoryImage;

    if (req.file) {
      finalImageUrl = await uploadImageInCloudinary(req.file, cloudinary_category_folder);
    }

    const newCategory = await CategoriesModal.create({
      category,
      categoryImage: finalImageUrl,
      subcategories
    });

    return res.status(200).json({ success: true, message: 'Category added successfully', category: newCategory })
  } catch (error) {
    return res.status(400).json({
      message: "Something went wrong", success: false, error: error.message,
    });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;

    let { category, categoryImage, subcategories } = req.body;

    const existingCategory = await CategoriesModal.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (category !== undefined) {
      if (category.trim() === "") {
        return res.status(400).json({ success: false, message: "Category name cannot be empty" });
      }
      existingCategory.category = category;
    }

    if (subcategories !== undefined) {
      if (typeof subcategories === "string") {
        try {
          subcategories = JSON.parse(subcategories);
        } catch (err) {
          subcategories = [].concat(req.body.subcategories);
        }
      }

      if (!Array.isArray(subcategories) || subcategories.length === 0) {
        return res.status(400).json({ success: false, message: "At least one subcategory is required" });
      }

      existingCategory.subcategories = subcategories;
    }

    let finalImageUrl = existingCategory.categoryImage;

    if (categoryImage) {
      if (categoryImage.trim() === "") {
        return res.status(400).json({ success: false, message: "Category image URL cannot be empty" });
      }
      if (existingCategory.categoryImage) {
        await deleteCloudinaryImageFromUrl(existingCategory.categoryImage);
      }
      finalImageUrl = categoryImage;
    }

    if (req.file) {
      if (existingCategory.categoryImage) {
        await deleteCloudinaryImageFromUrl(existingCategory.categoryImage);
      }
      finalImageUrl = await uploadImageInCloudinary(req.file, cloudinary_category_folder);
    }

    existingCategory.categoryImage = finalImageUrl;

    const updatedCategory = await existingCategory.save();

    return res.status(200).json({ success: true, message: "Category updated successfully", category: updatedCategory });

  } catch (error) {
    return res.status(400).json({
      success: false, message: "Something went wrong", error: error.message
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await CategoriesModal.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const productUsingCategory = await Products.findOne({ category: id });

    if (productUsingCategory) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category. Some products are using this category. Please change them first."
      });
    }

    if (category.categoryImage) {
      await deleteCloudinaryImageFromUrl(category.categoryImage);
    }

    await CategoriesModal.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Category deleted successfully", });

  } catch (error) {
    return res.status(400).json({ success: false, message: "Something went wrong", error: error.message });
  }
}

async function getAllCategories(req, res) {
  try {

    const allCategories = await CategoriesModal.find().sort({ _id: -1 });

    return res.status(200).json({ success: true, message: 'All categories', categories: allCategories })
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong", success: false, error: error.message, });
  }
}

async function getAllOrder(req, res) {
  try {
    const status = req.query.order_Status || "all";

    let query = {};

    if (status !== "all") {
      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid order status" });
      }
      query.Order_Status = status;
    }

    const orders = await OrderModal.find(query).sort({ createdAt: -1 }).populate('OrderById', '-password -FCMToken').populate('assignedTo')
    return res.status(200).json({ success: true, message: `Orders fetched successfully${status !== "all" ? ` for ${status} status` : ""}`, orders })
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong", success: false, error: error.message, });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status, assignedTo } = req.body;

    if (!orderId) return res.status(400).json({ success: false, message: "Order ID is required" });


    if (!status) return res.status(400).json({ success: false, message: "Status is required" });


    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status value" });


    const order = await OrderModal.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (status === "Assigned") {
      if (!assignedTo) {
        return res.status(400).json({
          success: false, message: "assignedTo is required when status is 'Assigned'"
        });
      }
      order.assignedTo = assignedTo;
    }

    if (status === "Delivered") {

      if (!order.assignedTo) {
        return res.status(400).json({ success: false, message: "Cannot mark Delivered because no driver was assigned" });
      }

      await DriverSchema.updateOne(
        { _id: order.assignedTo },
        { $inc: { deliveries: 1 } }
      );
    }

    order.Order_Status = status;
    await order.save();

    return res.status(200).json({ success: true, message: `Order status updated to ${status}` });

  } catch (error) {
    return res.status(400).json({ message: "Something went wrong", success: false, error: error.message, });
  }
}

async function addNewDriver(req, res) {
  try {
    let { name, email, phone, licenseNumber, vehicleNumber, address, cnicNumber } = req.body;

    if (!name || !email || !phone || !licenseNumber || !vehicleNumber || !cnicNumber || !address) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    email = email.toLowerCase();

    const existingDriver = await DriverSchema.collection.findOne({ email });

    if (existingDriver) {
      if (existingDriver.isDeleted) {
        return res.status(400).json({
          success: false,
          message: "A driver with this email was previously deleted. Cannot create a new driver with the same email."
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "A driver with this email already exists."
        });
      }
    }
    let cnicFrontUrl = null;
    let cnicBackUrl = null;

    if (req.files?.cnicFront?.[0]) {
      cnicFrontUrl = await uploadImageInCloudinary(req.files.cnicFront[0], cloudinary_cnic_folder);
    }
    if (req.files?.cnicBack?.[0]) {
      cnicBackUrl = await uploadImageInCloudinary(req.files.cnicBack[0], cloudinary_cnic_folder);
    }

    const newDriver = await DriverSchema.create({
      name, email, phone, licenseNumber, vehicleNumber, address, cnicNumber,
      cnicFront: cnicFrontUrl,
      cnicBack: cnicBackUrl
    });

    return res.status(200).json({
      success: true, message: "Driver added successfully", driver: newDriver
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({ message: "Something went wrong", success: false, error: error.message, });
  }
}

async function updateDriver(req, res) {
  try {
    const { driverId } = req.params;

    if (!driverId) return res.status(400).json({ success: false, message: "Driver ID is required" });

    const driver = await DriverSchema.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });


    const { name, email, phone, licenseNumber, vehicleNumber, address, cnicNumber, status } = req.body;

    if (name) driver.name = name;
    if (email) driver.email = email.toLowerCase();
    if (phone) driver.phone = phone;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (vehicleNumber) driver.vehicleNumber = vehicleNumber;
    if (address) driver.address = address;
    if (cnicNumber) driver.cnicNumber = cnicNumber;
    if (status) driver.status = status;

    if (req.files?.cnicFront?.[0]) {
      if (driver.cnicFront) {
        await deleteCloudinaryImageFromUrl(driver.cnicFront);
      }
      driver.cnicFront = await uploadImageInCloudinary(req.files.cnicFront[0], cloudinary_cnic_folder);
    }
    if (req.files?.cnicBack?.[0]) {
      if (driver.cnicBack) {
        await deleteCloudinaryImageFromUrl(driver.cnicFront);
      }
      driver.cnicBack = await uploadImageInCloudinary(req.files.cnicBack[0], cloudinary_cnic_folder);
    }

    const updatedDriver = await driver.save();

    return res.status(200).json({
      success: true, message: "Driver updated successfully", driver: updatedDriver
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
}

async function deleteDriver(req, res) {
  try {
    const { driverId } = req.params;

    if (!driverId) return res.status(400).json({ success: false, message: "Driver ID is required" });


    const driver = await DriverSchema.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    await DriverSchema.findByIdAndUpdate(driverId, { isDeleted: true, deletedAt: new Date() });

    return res.status(200).json({ success: true, message: "Driver deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false, message: "Something went wrong", error: error.message
    });
  }
}

async function getDrivers(req, res) {
  try {
    const { driverId } = req.params;
    let { status } = req.query;

    if (!status) status = "all";

    if (driverId) {
      const driver = await DriverSchema.findById(driverId);
      if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

      return res.status(200).json({ success: true, driver });
    }

    let filter = {};
    if (status !== "all") {
      if (!DRIVER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status value" });

      filter.status = status;
    }

    const drivers = await DriverSchema.find(filter).sort({ createdAt: -1 });

    const summary = await DriverSchema.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalDrivers: { $sum: 1 },
          activeDrivers: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          inactiveDrivers: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
        },
      },
    ]);

    const counts = summary[0] ? {
      totalDrivers: summary[0].totalDrivers,
      activeDrivers: summary[0].activeDrivers,
      inactiveDrivers: summary[0].inactiveDrivers,
    } : { totalDrivers: 0, activeDrivers: 0, inactiveDrivers: 0 };

    return res.status(200).json({
      success: true, message: drivers.length ? "Drivers fetched successfully" : "No drivers found", drivers,
      summary: counts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
}

async function adminLogin(req, res) {
  try {
    const { email, password, role } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email are required" });
    if (!password) return res.status(400).json({ success: false, message: "Password are required" });
    if (!role) return res.status(400).json({ success: false, message: "Role are required" });

    const admin = await Users.findOne({ email: email.toLowerCase(), role: role });

    if (!admin) return res.status(404).json({ success: false, message: "Admin account not found" });

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) return res.status(400).json({ success: false, message: "Invalid password" });

    const tokenPayload = { _id: admin._id.toString(), email: admin.email }

    const token = JWT.sign(tokenPayload, process.env.JWT_SECRET_KEY);

    const safeAdmin = admin.toObject();
    delete safeAdmin.password;

    return res.status(200).json({
      success: true, message: "Admin logged in successfully", admin: safeAdmin, token
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
}

async function getDashboardStats(req, res) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const todayStr = `${day}-${month}-${year}`;

    const [orderStats] = await OrderModal.aggregate([
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          assignedOrders: [{ $match: { Order_Status: "Assigned" } }, { $count: "count" }],
          pendingOrders: [{ $match: { Order_Status: "Pending" } }, { $count: "count" }],
          CompletedOrders: [{ $match: { Order_Status: "Delivered" } }, { $count: "count" }],
          readyForDelivery: [{ $match: { Order_Status: "Assigned" } }, { $count: "count" }],
          todayRevenue: [
            { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
            { $group: { _id: null, totalRevenue: { $sum: "$Total_Price" } } }
          ],
          totalRevenue: [{ $group: { _id: null, totalRevenue: { $sum: "$Total_Price" } } }],
          productsSold: [
            { $unwind: "$Purchased_Product_List" },
            { $group: { _id: null, totalSold: { $sum: "$Purchased_Product_List.total" } } }
          ],
          deliveryToday: [
            { $match: { deliveryDate: todayStr } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const totalCustomers = await Users.countDocuments();

    const totalOrders = orderStats.totalOrders[0]?.count || 0;
    const pendingOrders = orderStats.pendingOrders[0]?.count || 0;
    const CompletedOrders = orderStats.CompletedOrders[0]?.count || 0;
    const readyForDelivery = orderStats.readyForDelivery[0]?.count || 0;
    const totalRevenue = orderStats.totalRevenue[0]?.totalRevenue || 0;
    const todayRevenue = orderStats.todayRevenue[0]?.totalRevenue || 0;
    const productsSold = orderStats.productsSold[0]?.totalSold || 0;
    const assignedOrders = orderStats.assignedOrders[0]?.count || 0;
    const deliveryToday = orderStats.deliveryToday[0]?.count || 0;

    return res.json({
      success: true, message: "Dashboard data fetched successfully", totalOrders, pendingOrders,
      readyForDelivery, totalRevenue, todayRevenue, totalCustomers, productsSold, assignedOrders, deliveryToday, CompletedOrders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
}



module.exports = {
  uploadImage, addProduct, getAllProducts, updateProduct, deleteProduct, addCategory,
  updateCategory, deleteCategory, getAllCategories, getAllOrder, updateOrderStatus,
  addNewDriver, updateDriver, deleteDriver, getDrivers, adminLogin, getDashboardStats
};
