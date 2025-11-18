//cloudinary
const cloudinary = require("cloudinary").v2;
const XLSX = require("xlsx");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
//end cloudinary

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key, 
  api_secret: process.env.api_secret,
});

const workbook = XLSX.readFile("naheed_products.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const products = XLSX.utils.sheet_to_json(sheet);

async function uploadToCloudinary(imageUrl) {
  try {
    // Remove 'Naheed' from the URL
    // const sanitizedImageUrl = imageUrl.replace('naheed', '');

    const filename = path.basename(imageUrl);
    const tempPath = path.join(__dirname, 'temp_' + filename);

    // Download the image
    const response = await axios({ url: imageUrl, responseType: 'arraybuffer' });
    fs.writeFileSync(tempPath, response.data);

    // Upload the image to Cloudinary
    const uploaded = await cloudinary.uploader.upload(tempPath, { folder: 'supermarket' });
    fs.unlinkSync(tempPath); // Remove temporary file

    return uploaded.secure_url;
  } catch (err) {
    console.error('❌ Image upload failed:', err.message);
    return null;
  }
}


async function UploadProduct() {
//   await mongoose.connect(process.env.MONGO_URI);
//   console.log('✅ Connected to MongoDB');

  const workbook = XLSX.readFile('naheed_products.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  try {
      for (const row of rows) {
      const name = row['Product'].replace('Naheed', '');
      const category = row['Category'].replace('Naheed', 'Fattani');
      const priceString = row['Price'].replace('Rs.', '').trim();
      const price = parseInt(priceString.replace(/,/g, ''));
      const imageUrl = row['Image URL'];

      
      const uploadedImage = await uploadToCloudinary(imageUrl);



      
      
        const newProduct = new Product({
            name,
            category,
            price,
            productImage: uploadedImage || imageUrl, // fallback if upload fails
          });
        
          await newProduct.save();
        console.log(`✅ Uploaded: ${imageUrl}`);
    }
    } catch (error) {
      console.error('⚠️ Error saving product:', error.message);
    }
  }



  