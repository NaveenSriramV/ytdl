const dotenv = require("dotenv").config();

const S3_ID = process.env.S3_ID || "";
const S3_SECRET = process.env.S3_SECRET || "";
const BUCKET_NAME = process.env.BUCKET_NAME || "";
const FILE_EXPIRATION_TIME = process.env.FILE_EXPIRATION_TIME || "60";
const S3_REGION = process.env.S3_REGION || "ap-south-1";
const S3_SIGNATURE = process.env.S3_SIGNATURE || "v4";

module.exports = {
  BUCKET_NAME,
  S3_ID,
  S3_SECRET,
  FILE_EXPIRATION_TIME,
  S3_REGION,
  S3_SIGNATURE,
};
