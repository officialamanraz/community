const multer = require('multer');
const cloudnary = require('cloudinary').v2;
const {CloudnaryStorage} = require('multer-storage-cloudinary');

cloudnary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudnaryStorage({
    cloudnary:cloudnary,
    params:{
        folder:'community_app_images',
        allowed_formate:['jpg','jpeg','png','webp']
    }
});

const upload = multer({ storage: storage,
 });

module.exports = upload;