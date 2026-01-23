const Banner = require("../models/Banner");
const { uploadImageInCloudinary, deleteCloudinaryImageFromUrl } = require("../functions/cloudinaryHelper");

const cloudinary_banner_folder = "Fattanisupermarket/Banner";

async function createBanner(req, res) {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Title is required" });
        if (!req.file) return res.status(400).json({ success: false, message: "Banner image is required" });

        const bannerImage = await uploadImageInCloudinary(req.file, cloudinary_banner_folder);

        const newBanner = new Banner({ title, bannerImage });
        await newBanner.save();
        return res.status(200).json({
            success: true,
            message: "Banner created successfully",
            data: newBanner,
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
}

async function getAllBanners(req, res) {
    try {
        const { activeOnly } = req.query;
        let query = { isDeleted: false };
        if (activeOnly === "true") {
            query.isActive = true;
        }
        const banners = await Banner.find(query).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "Banners fetched successfully",
            data: banners,
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
}

async function updateBanner(req, res) {
    try {
        const { id } = req.params;
        const { title, isActive } = req.body;
        const banner = await Banner.findById(id);
        if (!banner || banner.isDeleted) {
            return res.status(200).json({
                success: false,
                message: "Banner not found",
            });
        }

        if (title) banner.title = title;
        if (isActive !== undefined) banner.isActive = isActive;

        if (req.file) {
            if (banner.bannerImage) {
                await deleteCloudinaryImageFromUrl(banner.bannerImage);
            }
            banner.bannerImage = await uploadImageInCloudinary(req.file, cloudinary_banner_folder);
        }

        await banner.save();
        return res.status(200).json({
            success: true,
            message: "Banner updated successfully",
            data: banner,
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
}

async function deleteBanner(req, res) {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);
        if (!banner || banner.isDeleted) {
            return res.status(200).json({
                success: false,
                message: "Banner not found",
            });
        }
        banner.isDeleted = true;
        await banner.save();
        return res.status(200).json({
            success: true,
            message: "Banner deleted successfully",
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
    createBanner,
    getAllBanners,
    updateBanner,
    deleteBanner,
};
