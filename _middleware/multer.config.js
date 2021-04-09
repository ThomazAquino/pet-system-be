const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

const MAX_SIZE_TWO_MEGABYTES = 2 * 1024 * 1024;

const storageTypes = {
  local: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "..", "images"));
    },
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);
        let fileExtension = `.${file.mimetype.split('/')[1]}`;
        // console.log('fileExtension -->', fileExtension);
        file.key = `${hash.toString("hex")}${fileExtension}`;

        cb(null, file.key);
      });
    },
  }),
  // s3: multerS3({
  //   s3: new aws.S3(),
  //   bucket: process.env.BUCKET_NAME,
  //   contentType: multerS3.AUTO_CONTENT_TYPE,
  //   acl: "public-read",
  //   key: (req, file, cb) => {
  //     crypto.randomBytes(16, (err, hash) => {
  //       if (err) cb(err);

  //       const fileName = `${hash.toString("hex")}-${file.originalname}`;

  //       cb(null, fileName);
  //     });
  //   },
  // }),
};

async function uploadSingleImage(req, fileKey) {
  console.log(fileKey)
  const upload = multer(config).single(fileKey);
  return new Promise((resolve, reject) => {
      upload(req, null, function(err) {    
        console.log('calll', req.body)
          if (req.file) {
              fileName = req.file.filename;
              resolve(req.file.filename);
          }
          else if (err instanceof multer.MulterError) {
              reject(err);
          }
          else if (err) {
            reject(err);
          }
      });
  });

}
const config = {
  dest: path.resolve(__dirname, "..", "images"),
  storage: storageTypes[process.env.STORAGE_TYPE],
  limits: {
    fileSize: MAX_SIZE_TWO_MEGABYTES,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."));
    }
  },
}

module.exports = {
  uploadSingleImage,
  config,
};