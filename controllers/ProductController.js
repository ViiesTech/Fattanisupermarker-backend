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

    // 🧠 Case-insensitive partial search on multiple fields
    const filter = {
      $or: [
        { name: { $regex: query, $options: "i" } }, // search in name
        { subCategory: { $regex: query, $options: "i" } }, // optional: search in subCategory
        { parentCategory: { $regex: query, $options: "i" } }, // optional: search in parentCategory
      ],
    };

    // Total count for pagination
    const total = await ProductModal.countDocuments(filter);

    // Fetch paginated results
    const products = await ProductModal.find(filter)
      .skip(skip)
      .limit(numericLimit)
      .lean();

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No products found for this search term",
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

module.exports = {
  //apis
  getProductsByCatagories,
  getProductParentCategories,
  getProductsBySubcategories,
  searchProducts,

  
  //fucntios
  updateSingleProductCategory,
  updateSingleProductSubCategory,
};
