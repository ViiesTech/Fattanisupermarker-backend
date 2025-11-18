
const cloudinary = require("../config/cloudinary");
async function deleteCloudinaryImageFromUrl(url) {
  if (!url) return { result: "no_url_provided" };

  try {
    let publicIdWithVersion = url.split('/upload/')[1];

    const parts = publicIdWithVersion.split('/');

    if (parts[0].startsWith('v') && /^\d+$/.test(parts[0].slice(1))) {
      parts.shift();
    }

    const publicId = parts.join('/').split('.')[0];

    const result = await cloudinary.uploader.destroy(publicId);

    console.log("Cloudinary delete result:", result);
    return result;

  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return { result: "error", error: error.message };
  }
}

async function uploadImageInCloudinary(file, folder) {
  if (!file) throw new Error("No file provided for upload");

  try {
    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Data, {
      folder: folder,
      resource_type: 'auto',
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

module.exports = {
  deleteCloudinaryImageFromUrl , uploadImageInCloudinary
}
