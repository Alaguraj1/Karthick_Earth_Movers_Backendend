const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, 'bill-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('bill');

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images or PDFs Only!');
    }
}

router.post('/', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).json({ success: false, error: err });
        } else {
            if (req.file == undefined) {
                res.status(400).json({ success: false, error: 'No file selected' });
            } else {
                res.status(200).json({
                    success: true,
                    filePath: `/uploads/${req.file.filename}`
                });
            }
        }
    });
});

module.exports = router;
