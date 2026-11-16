const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/datasets');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.csv', '.zip'];

  if (!allowedExts.includes(ext)) {
    return cb(new Error('Only .csv and .zip files are allowed for dataset uploads'), false);
  }

  cb(null, true);
};

const maxFileSize = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50) * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize
  }
});

module.exports = upload;
