const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { configDotenv } = require("dotenv");

configDotenv();

const upload = multer({
    storage: multerS3({
        s3: new S3Client({
            region: process.env.DO_SPACES_REGION,
            endpoint: process.env.DO_SPACES_ENDPOINT,
            credentials: {
                accessKeyId: process.env.DO_SPACES_KEY,
                secretAccessKey: process.env.DO_SPACES_SECRET
            }
        }),
        bucket: process.env.DO_SPACES_BUCKET_NAME,
        acl: "public-read",
        contentType(_req, file, callback) {
            callback(null, file.mimetype);
        },
        key: (_request, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(
                null,
                `uploads/${file.fieldname}s/${file.fieldname}-${uniqueSuffix}.${file.mimetype.split("/")[1]}`
            );
        }
    }),
    // multer.diskStorage({
    //     destination: "uploads/images",
    //     filename: (_req, file, cb) => {
    //         const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    //         cb(null, `${file.fieldname}-${uniqueSuffix}.${file.mimetype.split("/")[1]}`);
    //     }
    // }),
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(file.mimetype)) {
            const error = new Error("نوع الملف غير مدعوم");
            return cb(error);
        }
        cb(null, true);
    }
});

module.exports = { upload };
