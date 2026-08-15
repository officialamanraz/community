const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cloudinaryStorageModule = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

let storage;

// Yeh code khud detect karega ki Render par kaunsa version hai
if (cloudinaryStorageModule.CloudinaryStorage) {
    // Naya Version (v4+) ke liye
    storage = new cloudinaryStorageModule.CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'community_app_images',
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp']
        }
    });
} else {
    // Purane Version (v2/v3) ke liye (Bina 'new' keyword ke)
    storage = cloudinaryStorageModule({
        cloudinary: cloudinary,
        folder: 'community_app_images',
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp']
    });
}

const upload = multer({ storage: storage });

module.exports = upload;