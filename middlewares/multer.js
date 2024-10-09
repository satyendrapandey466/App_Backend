const multer = require("multer");
const storage = multer.diskStorage({});//Storage creation

//File filter creation which manages  the type of files can be provided
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image")) {
    cb("Supported only image files!", false);
  }
  cb(null, true);
};

//vedio filter creation which will handle the vedio upload 
const videoFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("video")) {
    cb("Supported only image files!", false);
  }
  cb(null, true);
};

//Creation of multimedia parser middleware
exports.uploadImage = multer({ storage, fileFilter });
exports.uploadVideo = multer({ storage, fileFilter: videoFileFilter });
