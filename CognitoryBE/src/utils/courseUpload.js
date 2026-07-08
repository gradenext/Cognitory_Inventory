import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const UPLOAD_RETRIES = 2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000,
});

const validateFile = async (filePath) => {
  const stats = await fs.promises.stat(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
  }
};

const uploadSingle = (filePath, publicId, folderPath) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      filePath,
      {
        folder: folderPath || "Cognitory/courses",
        resource_type: "raw",
        type: "upload",
        access_mode: "public",
        public_id: publicId,
        chunk_size: 6 * 1024 * 1024, // 6MB chunks — under Cloudinary's 10MB single-upload limit
        timeout: 300000,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

export const uploadCourseFile = async (filePath, publicId, folderPath) => {
  await validateFile(filePath);

  for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
    try {
      return await uploadSingle(filePath, publicId, folderPath);
    } catch (err) {
      if (attempt === UPLOAD_RETRIES) {
        console.error("Cloudinary course upload failed after retries:", err);
        throw new Error("Failed to upload course file");
      }
      console.warn(`Retrying course upload (${attempt + 1}/${UPLOAD_RETRIES})...`);
    }
  }
};
