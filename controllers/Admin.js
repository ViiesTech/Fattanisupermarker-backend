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

const cloudinary_folder = "Fattanisupermarket/Images"
const cloudinary_product_folder = "Fattanisupermarket/Product";
const cloudinary_category_folder = "Fattanisupermarket/Category";
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
          { category: regex },
          { subCategory: regex },
        ],
      };
    }

    const products = await Products.find(query).sort({ _id: -1 }).skip(skip).limit(limit).lean();

    return res.status(200).json({ success: true, message: 'All products', products, currentPage: page, })
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

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;
    let cnicFrontUrl = req.files?.cnicFront ? baseUrl + req.files.cnicFront[0].filename : null;
    let cnicBackUrl = req.files?.cnicBack ? baseUrl + req.files.cnicBack[0].filename : null;

    const newDriver = await DriverSchema.create({
      name, email, phone, licenseNumber, vehicleNumber, address, cnicNumber,
      cnicFront: cnicFrontUrl,
      cnicBack: cnicBackUrl
    });

    return res.status(200).json({
      success: true, message: "Driver added successfully", driver: newDriver
    });
  } catch (error) {
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

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;
    if (req.files?.cnicFront) {
      driver.cnicFront = baseUrl + req.files.cnicFront[0].filename;
    }
    if (req.files?.cnicBack) {
      driver.cnicBack = baseUrl + req.files.cnicBack[0].filename;
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

    await DriverSchema.findByIdAndDelete(driverId);

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

    return res.status(200).json({
      success: true, message: drivers.length ? "Drivers fetched successfully" : "No drivers found", drivers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
}


module.exports = {
  uploadImage, addProduct, getAllProducts, updateProduct, deleteProduct, addCategory,
  updateCategory, deleteCategory, getAllCategories, getAllOrder, updateOrderStatus,
  addNewDriver, updateDriver, deleteDriver , getDrivers
};
