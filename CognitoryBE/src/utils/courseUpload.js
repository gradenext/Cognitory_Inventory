import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const MIME_TYPES = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

const validateFile = async (filePath) => {
  const stats = await fs.promises.stat(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
  }
};

export const uploadCourseFile = async (filePath, publicId, folderPath, fileExt = "") => {
  await validateFile(filePath);

  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  const key = `${folderPath || "courses"}/${publicId}${fileExt ? `.${fileExt}` : ""}`;
  const contentType = MIME_TYPES[fileExt?.toLowerCase()] || "application/octet-stream";

  const fileBuffer = await fs.promises.readFile(filePath);

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return {
    secure_url: `${publicUrl}/${key}`,
    public_id: key,
  };
};
