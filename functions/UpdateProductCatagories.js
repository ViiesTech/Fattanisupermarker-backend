// const Products = require('../models/Products');


// export async function updateProductCategories() {
//   try {

//     const products = await Products.find();
//     let updatedCount = 0;

//     for (const product of products) {
//       if (!product.category) continue;

//       const parts = product.category.split(/[-–]/).map(s => s.trim());

//       let parentCategory, subCategory;
//       if (parts.length > 1) {
//         parentCategory = parts[0];
//         subCategory = parts[1];
//       } else {
//         parentCategory = parts[0];
//         subCategory = parts[0];
//       }

//       const result = await Product.updateOne(
//         { _id: product._id },
//         { $set: { parentCategory, subCategory } }
//       );

//       if (result.modifiedCount > 0) {
//         updatedCount++;
//         console.log(`✅ Updated: ${product.name} → ${parentCategory} / ${subCategory}`);
//       }
//     }

//     console.log(`\n📊 Total products updated: ${updatedCount}/${products.length}`);
//     await mongoose.disconnect();
//     console.log("🔌 Disconnected from MongoDB");
//   } catch (err) {
//     console.error("❌ Error updating categories:", err);
//   }
// }




// export async function   updateSingleProductCategory() {
//   try {
//     // 🧠 Connect to MongoDB (optional if already connected elsewhere)


//     // 🟢 Fetch one product — by ID if provided, otherwise just the first one
//     const product =  await Products.findById("68f7d37722b35a6090cf8f28")

//     if (!product) {
//       console.log("❌ No product found!");
//       return;
//     }

//     if (!product.category) {
//       console.log(`⚠️ Product has no category: ${product.name}`);
//       return;
//     }

//     const parts = product.category.split(/[-–]/).map(s => s.trim());

//     let parentCategory, subCategory;
//     if (parts.length > 1) {
//       parentCategory = parts[0];
//       subCategory = parts[1];
//     } else {
//       parentCategory = parts[0];
//       subCategory = parts[0];
//     }

//     const result = await Products.updateOne(
//       { _id: product._id },
//       { $set: { parentCategory, subCategory } }
//     );

//     if (result.modifiedCount > 0) {
//       console.log(`✅ Updated: ${product.name}`);
//       console.log(`Parent: ${parentCategory} | Sub: ${subCategory}`);
//     } else {
//       console.log(`⚠️ No changes made to: ${product.name}`);
//     }

//     console.log("🔌 Disconnected from MongoDB");
//   } catch (err) {
//     console.error("❌ Error updating product:", err);
//   }
// }
