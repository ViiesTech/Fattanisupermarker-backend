const routes = require("express").Router();
const upload = require("../middleware/multer");
const adminController = require('../controllers/Admin');
const localUpload = require("../middleware/localUpload");

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

// Orders
routes.route('/order')
    .get(adminController.getAllOrder)
routes.route('/order/:orderId')
    .patch(upload.single("image"), adminController.updateOrderStatus)

// Drivers
routes.route('/driver')
    .post(localUpload.fields([
        { name: 'cnicFront', maxCount: 1 },
        { name: 'cnicBack', maxCount: 1 }
    ]), adminController.addNewDriver)
    .get(adminController.getDrivers)

routes.route('/driver/:driverId')
    .patch(
        localUpload.fields([
            { name: "cnicFront", maxCount: 1 },
            { name: "cnicBack", maxCount: 1 }
        ]),
        adminController.updateDriver
    )
    .delete(adminController.deleteDriver)
    .get(adminController.getDrivers)

module.exports = routes;