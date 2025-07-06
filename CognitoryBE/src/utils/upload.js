import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // 100MB
const UPLOAD_RETRIES = 2;

// Setup Cloudinary config with timeout
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000, // 2 minutes
});

/**
 * Validates the file size and path
 */
const validateFile = async (filePath) => {
  const stats = await fs.promises.stat(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
  }
};

/**
 * Upload a single file to Cloudinary via streaming
 */
const uploadSingle = (filePath, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "Cognitory",
        resource_type: "auto",
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    fs.createReadStream(filePath).on("error", reject).pipe(uploadStream);
  });
};

/**
 * Retry wrapper around uploadSingle
 */
export const upload = async (filePath, publicId) => {
  await validateFile(filePath);

  for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
    try {
      return await uploadSingle(filePath, publicId);
    } catch (err) {
      if (attempt === UPLOAD_RETRIES) {
        console.error("Cloudinary upload failed after retries:", err);
        throw new Error("Failed to upload image");
      }
      console.warn(`Retrying upload (${attempt + 1}/${UPLOAD_RETRIES})...`);
    }
  }
};
