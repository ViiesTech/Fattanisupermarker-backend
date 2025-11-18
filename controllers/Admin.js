const upload = require("../middleware/multer");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const Products = require("../models/Products");
const CategoriesModal = require("../models/CategoriesModal");
const { deleteCloudinaryImageFromUrl, uploadImageInCloudinary } = require("../functions/cloudinaryHelper");

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
    const { name, category, price, productImage, parentCategory, subCategory } =
      req.body;

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
    const { name, category, price, productImage, parentCategory, subCategory } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

    const product = await Products.findById(productId);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (name) product.name = name;
    if (category) product.category = category;
    if (price) product.price = price;
    if (parentCategory) product.parentCategory = parentCategory;
    if (subCategory) product.subCategory = subCategory;

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

    const allProducts = await Products.find().sort({ _id: -1 });

    return res.status(200).json({ success: true, message: 'All products', products: allProducts })
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


module.exports = {
  uploadImage, addProduct, getAllProducts, updateProduct, deleteProduct, addCategory,
  updateCategory, deleteCategory, getAllCategories
};
