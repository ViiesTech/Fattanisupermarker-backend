
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
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
  if (!file) throw new Error("No file provided");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );

    // pipe file stream from disk
    if (file.buffer) {
      stream.end(file.buffer);
    } else if (file.path) {
      fs.createReadStream(file.path).pipe(stream);
    } else {
      return reject(new Error("File has no buffer or path"));
    }
  });
}
// async function uploadImageInCloudinary(file, folder) {
//   if (!file) throw new Error("No file provided for upload");

//   try {
//     const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

//     const result = await cloudinary.uploader.upload(base64Data, {
//       folder: folder,
//       resource_type: 'auto',
//     });

//     return result.secure_url;
//   } catch (error) {
//     console.error("Cloudinary upload error:", error);
//     throw new Error("Failed to upload image to Cloudinary");
//   }
// }

module.exports = {
  deleteCloudinaryImageFromUrl, uploadImageInCloudinary
}
