const ProductModal = require("../models/Products");



async function addProductOnDeal(req, res) {
    try {
        const { productId, dealPercentage } = req.body;
        const product = await ProductModal.findById(productId);
        if (!product) {
            return res.status(200).json({
                success: false,
                message: "Product not found",
            });
        }
        product.isOnDeal = true;
        product.dealPercentage = dealPercentage;
        await product.save();
        return res.status(200).json({
            success: true,
            message: "Product added to deal",
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
}

async function getProductsOnDeal(req, res) {
    try {
        const products = await ProductModal.find({ isOnDeal: true });
        return res.status(200).json({
            success: true,
            message: "Products on deal fetched successfully",
            data: products,
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
}

async function updateProductDeal(req, res) {
    try {
        const { productId, dealPercentage } = req.body;
        const product = await ProductModal.findById(productId);
        if (!product) {
            return res.status(200).json({
                success: false,
                message: "Product not found",
            });
        }
        product.dealPercentage = dealPercentage;
        await product.save();
        return res.status(200).json({
            success: true,
            message: "Product deal updated",
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
}


async function removeProductFromDeal(req, res) {
    try {
        const { productId } = req.body;
        const product = await ProductModal.findById(productId);
        if (!product) {
            return res.status(200).json({
                success: false,
                message: "Product not found",
            });
        }
        product.isOnDeal = false;
        product.dealPercentage = 0;
        await product.save();
        return res.status(200).json({
            success: true,
            message: "Product removed from deal",
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
}




module.exports = {
    //apis
    addProductOnDeal,
    getProductsOnDeal,
    updateProductDeal,
    removeProductFromDeal,
};
