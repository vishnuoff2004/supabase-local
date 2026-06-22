const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { minioClient, BUCKET_NAME } = require('../config/minio');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF are supported.'), false);
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 },
}).fields([
  { name: 'licenseDoc', maxCount: 1 },
  { name: 'vehicleRc', maxCount: 1 },
]);

function saveToLocal(file, subDir) {
  const dir = path.join(UPLOAD_DIR, subDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(dir, filename), file.buffer);
  return `/uploads/${subDir}/${filename}`;
}

const handleUploads = (req, res, next) => {
  multerUpload(req, res, async (err) => {
    if (err) {
      let errMsg = err.message;
      if (err.code === 'LIMIT_FILE_SIZE') {
        errMsg = 'File size limit exceeded. Max size allowed is 4 MB.';
      }
      return res.status(400).json({ message: errMsg });
    }

    if (req.body.role === 'driver') {
      if (!req.files || !req.files.licenseDoc || !req.files.vehicleRc) {
        return res.status(400).json({ message: 'Both Driving License and Vehicle RC documents are required.' });
      }
    } else {
      return next();
    }

    try {
      const licenseFile = req.files.licenseDoc[0];
      const rcFile = req.files.vehicleRc[0];

      const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
      const licenseExt = path.extname(licenseFile.originalname).toLowerCase();
      const rcExt = path.extname(rcFile.originalname).toLowerCase();

      if (!allowedExts.includes(licenseExt) || !allowedExts.includes(rcExt)) {
        return res.status(400).json({ message: 'Invalid file extension. Only JPG, JPEG, PNG, and PDF are allowed.' });
      }

      const uniqueId = crypto.randomBytes(8).toString('hex');
      const timestamp = Date.now();

      const licenseFilename = `driver-license/${timestamp}-${uniqueId}${licenseExt}`;
      const rcFilename = `rc/${timestamp}-${uniqueId}${rcExt}`;

      await minioClient.putObject(
        BUCKET_NAME,
        licenseFilename,
        licenseFile.buffer,
        licenseFile.size,
        { 'Content-Type': licenseFile.mimetype }
      );

      await minioClient.putObject(
        BUCKET_NAME,
        rcFilename,
        rcFile.buffer,
        rcFile.size,
        { 'Content-Type': rcFile.mimetype }
      );

      req.licenseDocUrl = `/api/images/${licenseFilename}`;
      req.vehicleRcUrl = `/api/images/${rcFilename}`;
    } catch (uploadError) {
      console.warn('MinIO upload failed, falling back to local disk:', uploadError.message);
      try {
        req.licenseDocUrl = saveToLocal(req.files.licenseDoc[0], 'driver-license');
        req.vehicleRcUrl = saveToLocal(req.files.vehicleRc[0], 'rc');
        console.log('Files saved to local disk as fallback');
      } catch (localError) {
        console.error('Local upload also failed:', localError);
        return res.status(500).json({ message: 'Failed to upload documents.' });
      }
    }

    next();
  });
};

module.exports = {
  handleUploads,
};
