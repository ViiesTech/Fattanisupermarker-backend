const routes = require("express").Router();
const upload = require("../middleware/multer");
const adminController = require('../controllers/Admin')


routes.post('/uploadImage', adminController.uploadImage)

// Product
routes.route('/product')
    .post(upload.single("image"), adminController.addProduct)
    .get(adminController.getAllProducts)
routes.route('/product/:productId')
    .patch(upload.single("image"), adminController.updateProduct)
    .delete(adminController.deleteProduct)

// Category 
routes.route('/category')
    .post(upload.single("image"), adminController.addCategory)
    .get(adminController.getAllCategories)
routes.route('/category/:id')
    .patch(upload.single("image"), adminController.updateCategory)
    .delete(adminController.deleteCategory)

module.exports = routes;