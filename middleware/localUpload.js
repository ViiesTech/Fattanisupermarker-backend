const multer = require('multer');
const path = require('path');

const uploadPath = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + file.originalname;
        cb(null, unique);
    }
});

const localUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = localUpload;
