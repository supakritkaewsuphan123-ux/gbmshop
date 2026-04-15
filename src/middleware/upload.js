const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage in RAM for cloud forwarding
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedImages = /jpeg|jpg|png|webp/;
    const allowedVideos = /mp4|webm|quicktime|mov/;
    const isImage = allowedImages.test(path.extname(file.originalname).toLowerCase()) || allowedImages.test(file.mimetype);
    const isVideo = allowedVideos.test(path.extname(file.originalname).toLowerCase()) || allowedVideos.test(file.mimetype);

    if (isImage || isVideo) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpg, png, webp) and videos (mp4, webm) are allowed'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for videos
    fileFilter: fileFilter
});

module.exports = upload;
