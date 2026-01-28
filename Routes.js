const routes = require("express").Router();
const {
  getProductsByCatagories,
  updateSingleProductCategory,
  getProductParentCategories,
  updateSingleProductSubCategory,
  getProductsBySubcategories,
  searchProducts,
  getSearchSuggestions,
  checkStock,
  getAllProducts,
  migrateBarcodes,
  //   getProductSubCategroies
} = require("./controllers/ProductController");
const {
  SignupWithEmailOrPhoneandPassword,
  VerifyOtpAndCreate,
  deleteUser,
  forgetPasswordOtpUser,
  loginWithEmailOrPhone,
  sendOtpOnMail,
  setNewPasswordByUser,
  signUpOrLoginWithGoogle,
  updateUserById,
  googleLogin,
  posLogin,
  createPOSUser,
} = require("./controllers/AuthController");

const { CreateOrder, GetMyOrders } = require("./controllers/OrderController");
const {
  addProductOnDeal,
  getProductsOnDeal,
  updateProductDeal,
  removeProductFromDeal,
} = require("./controllers/ProductDealsController");

const {
  createBanner,
  getAllBanners,
  updateBanner,
  deleteBanner,
} = require("./controllers/BannerController");

//Auth Routes
routes.post("/signupWithEmailOrPhoneandPassword", SignupWithEmailOrPhoneandPassword);
routes.post("/verifyOtpAndCreate", VerifyOtpAndCreate);
routes.post("/loginWithEmailOrPhone", loginWithEmailOrPhone);
routes.post("/forgetPasswordOtpUser", forgetPasswordOtpUser);
routes.post("/setNewPasswordByUser", setNewPasswordByUser);
routes.post("/signUpOrLoginWithGoogle", signUpOrLoginWithGoogle);
routes.put("/updateUserById/:id", updateUserById);
routes.delete("/deleteUser/:id", deleteUser);
routes.post('/googleLogin', googleLogin)

routes.post("/posLogin", posLogin);
routes.post("/createPOSUser", createPOSUser);

//Main Routes
routes.get("/getProductsByCatagories", getProductsByCatagories);
routes.get("/getProductParentCategories", getProductParentCategories);
routes.get("/products-by-subcategories", getProductsBySubcategories);
routes.get("/checkStock", checkStock);
routes.get("/getAllProducts", getAllProducts);
routes.get("/migrateBarcodes", migrateBarcodes);

//search apis
routes.get("/searchProducts", searchProducts);
routes.get("/searchSuggestions", getSearchSuggestions);

//Order Apis
routes.post("/CreateOrder", CreateOrder);
routes.get("/GetMyOrders", GetMyOrders);

//Product discount api
routes.post("/addProductOnDeal", addProductOnDeal);
routes.get("/getProductsOnDeal", getProductsOnDeal);
routes.put("/updateProductDeal", updateProductDeal);
routes.post("/removeProductFromDeal", removeProductFromDeal);

const upload = require("./middleware/multer");

//Banner Apis
routes.post("/createBanner", upload.single("bannerImage"), createBanner);
routes.get("/getAllBanners", getAllBanners);
routes.put("/updateBanner/:id", upload.single("bannerImage"), updateBanner);
routes.delete("/deleteBanner/:id", deleteBanner);



// routes.get("/getProductSubCategroies", getProductSubCategroies);
// routes.get("/updateSingleProductSubCategory", updateSingleProductSubCategory);

// routes.get("/updateSingleProductCategory", updateSingleProductCategory);

module.exports = routes;
