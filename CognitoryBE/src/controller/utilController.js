import fs from "fs/promises";
import dayjs from "dayjs";
import { upload } from "../utils/upload.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";

export const uploadFiles = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return handleError(res, {}, "No file uploaded", 400);
    }

    const files = Array.isArray(req.files.file)
      ? req.files.file
      : [req.files.file];

    const results = await Promise.all(
      files.map(async (file, index) => {
        const timeStamp = dayjs().format("YYYY-MM-DD_HH-mm-ss");
        const publicId = `file_${timeStamp}_${index}`;

        const result = await upload(file.tempFilePath, publicId);

        // Cleanup the temp file
        await fs.unlink(file.tempFilePath);

        return result.secure_url;
      })
    );

    // Send response
    return handleSuccess(res, {
      urls: files.length === 1 ? results[0] : results,
    }, "File upload successful", 200);

  } catch (error) {
    console.error("Upload Error:", error);
    return handleError(res, error, "File upload failed", 500);
  }
};
