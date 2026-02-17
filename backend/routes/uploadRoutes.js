const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert buffer to base64
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
            folder: 'registration_forms',
        });

        res.json({
            url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id
        });
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

module.exports = router;
