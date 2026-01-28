const ProductModal = require("../models/Products");
const CategoriesModal = require("../models/CategoriesModal");

async function getProductParentCategories(req, res) {
  try {
    const categories = await CategoriesModal.find({});

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
}

async function getProductsByCatagories(req, res) {
  const { category, page = 1, limit = 50 } = req.query;

  try {
    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }

    const numericPage = parseInt(page, 10);
    const numericLimit = parseInt(limit, 10);

    const skip = (numericPage - 1) * numericLimit;

    const filter = {
      $or: [
        { category: { $regex: category, $options: "i" } },
        { parentCategory: { $regex: category, $options: "i" } },
        { subCategory: { $regex: category, $options: "i" } },
      ],
    };

    // Get total count
    const total = await ProductModal.countDocuments(filter);

    // Fetch paginated results
    const products = await ProductModal.find(filter)
      .skip(skip)
      .limit(numericLimit);

    if (products.length > 0) {
      res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        total: products.length,
        page: numericPage,
        pageSize: numericLimit,
        products,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No products found for the given category",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
}

//get product by subscategories
async function getProductsBySubcategories(req, res) {
  try {
    let { subcategories, page = 1, limit = 30 } = req.query;

    // 🧠 Parse subcategories correctly
    if (!subcategories) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one subcategory",
      });
    }

    // Handle different formats (array, JSON string, comma-separated string)
    if (typeof subcategories === "string") {
      try {
        // Try to parse JSON array
        const parsed = JSON.parse(subcategories);
        if (Array.isArray(parsed)) {
          subcategories = parsed;
        } else {
          subcategories = subcategories.split(",").map((s) => s.trim());
        }
      } catch {
        // Not JSON — fallback to comma-separated
        subcategories = subcategories.split(",").map((s) => s.trim());
      }
    }

    if (!Array.isArray(subcategories) || subcategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategories format. Must be a non-empty array.",
      });
    }

    const numericPage = parseInt(page, 10);
    const numericLimit = parseInt(limit, 10);
    const skip = (numericPage - 1) * numericLimit;

    const filter = { subCategory: { $in: subcategories } };

    const total = await ProductModal.countDocuments(filter);
    const products = await ProductModal.find(filter)
    //   .skip(skip)
    //   .limit(numericLimit)
    //   .lean();

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total,
      currentPage: numericPage,
      pageSize: numericLimit,
      totalPages: Math.ceil(total / numericLimit),
      products,
    });
  } catch (error) {
    console.error("❌ Error fetching products by subcategories:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching products by subcategories",
      error: error.message,
    });
  }
}

//search api
async function searchProducts(req, res) {
  try {
    const { query, page = 1, limit = 30 } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a search query",
      });
    }

    const numericPage = parseInt(page, 10);
    const numericLimit = parseInt(limit, 10);
    const skip = (numericPage - 1) * numericLimit;

    // Use text index for better relevance
    const filter = {
      $text: { $search: query }
    };

    // Total count for pagination
    const total = await ProductModal.countDocuments(filter);

    // Fetch paginated results with relevance score
    const products = await ProductModal.find(
      filter,
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(numericLimit)
      .lean();

    if (!products.length) {
      // Fallback to regex if text search yields no results (for partial matches)
      const regexFilter = {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { subCategory: { $regex: query, $options: "i" } },
          { parentCategory: { $regex: query, $options: "i" } },
        ],
      };

      const fallbackProducts = await ProductModal.find(regexFilter)
        .limit(numericLimit)
        .lean();

      if (!fallbackProducts.length) {
        return res.status(404).json({
          success: false,
          message: "No products found for this search term",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Products fetched successfully (fallback)",
        total: fallbackProducts.length,
        currentPage: numericPage,
        pageSize: numericLimit,
        products: fallbackProducts,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total,
      currentPage: numericPage,
      pageSize: numericLimit,
      totalPages: Math.ceil(total / numericLimit),
      products,
    });
  } catch (error) {
    console.error("❌ Error searching products:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
}

// search suggestions api
async function getSearchSuggestions(req, res) {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(200).json({
        success: true,
        suggestions: [],
      });
    }

    // Lightweight search for suggestions
    const suggestions = await ProductModal.find(
      { name: { $regex: `^${query}`, $options: "i" } },
      { name: 1, productImage: 1, price: 1, _id: 1 }
    )
      .limit(10)
      .lean();

    // If not enough results starting with query, search anywhere in name
    if (suggestions.length < 5) {
      const additionalSuggestions = await ProductModal.find(
        {
          name: { $regex: query, $options: "i" },
          _id: { $nin: suggestions.map(s => s._id) }
        },
        { name: 1, productImage: 1, price: 1, _id: 1 }
      )
        .limit(10 - suggestions.length)
        .lean();

      suggestions.push(...additionalSuggestions);
    }

    return res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("❌ Error fetching search suggestions:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching search suggestions",
      error: error.message,
    });
  }
}








// this is the local data base category enter functions
async function updateSingleProductCategory() {
  try {
    const products = await ProductModal.find();
    let updatedCount = 0;

    for (const product of products) {
      if (!product.category) continue;

      const parts = product.category.split(/[-–]/).map((s) => s.trim());

      let parentCategory, subCategory;
      if (parts.length > 1) {
        parentCategory = parts[0];
        subCategory = parts[1];
      } else {
        parentCategory = parts[0];
        subCategory = parts[0];
      }

      const result = await ProductModal.updateOne(
        { _id: product._id },
        { $set: { parentCategory, subCategory } }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(
          `✅ Updated: ${product.name} → ${parentCategory} / ${subCategory}`
        );
      }
    }

    console.log(
      `\n📊 Total products updated: ${updatedCount}/${products.length}`
    );
  } catch (err) {
    console.error("❌ Error updating categories:", err);
  }
}

async function updateSingleProductSubCategory() {
  try {
    //    const categories = await CategoriesModal.findOne({category: "Beverages"});

    //    if(categories){
    const subCats = await ProductModal.find({
      category: { $regex: "Beverages", $options: "i" },
    }).distinct("subCategory");

    console.log("subCats", subCats);

    await CategoriesModal.updateOne(
      { _id: "68fc011cddb17a38f415fe65  " },
      {
        $addToSet: {
          // using $addToSet instead of push to avoid duplicates
          subcategories: { $each: subCats },
        },
      }
    );
    //    }
  } catch (err) {
    console.error("❌ Error updating categories:", err);
  }
}

async function checkStock(req, res) {
  try {
    const { productId, quantity } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await ProductModal.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const requestedQty = parseInt(quantity, 10) || 1;
    const isAvailable = product.stockCount >= requestedQty;

    return res.status(200).json({
      success: true,
      isAvailable,
      stockCount: product.stockCount,
      message: isAvailable
        ? "Stock available"
        : `Only ${product.stockCount} items available`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking stock",
      error: error.message,
    });
  }
}

async function getAllProducts(req, res) {
  try {


    const total = await ProductModal.countDocuments();
    const products = await ProductModal.find()


    return res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      total,
      products,
    });
  } catch (error) {
    console.error("❌ Error fetching all products:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching all products",
      error: error.message,
    });
  }
}

async function migrateBarcodes(req, res) {
  try {
    const result = await ProductModal.updateMany(
      { barcode: { $exists: false } },
      { $set: { barcode: "" } }
    );

    return res.status(200).json({
      success: true,
      message: "Migration completed successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error migrating barcodes:", error);
    return res.status(500).json({
      success: false,
      message: "Error migrating barcodes",
      error: error.message,
    });
  }
}

module.exports = {
  //apis
  getProductsByCatagories,
  getProductParentCategories,
  getProductsBySubcategories,
  searchProducts,
  getSearchSuggestions,
  checkStock,
  getAllProducts,
  migrateBarcodes,


  //fucntios
  updateSingleProductCategory,
  updateSingleProductSubCategory,
};
