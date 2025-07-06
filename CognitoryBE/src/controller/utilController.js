import fs from "fs/promises";
import { upload } from "../utils/upload.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import { v4 as uuidv4 } from "uuid";

export const uploadFiles = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return handleError(res, {}, "No file uploaded", 400);
    }

    const baseUUID = req.body?.uuid || uuidv4();
    const files = Array.isArray(req.files.file)
      ? req.files.file
      : [req.files.file];

    const results = await Promise.all(
      files.map(async (file, index) => {
        const suffix = `-${index + 1}`;
        const publicId = `${baseUUID}${files.length > 1 ? suffix : ""}`;

        // Upload and cleanup
        const result = await upload(file.tempFilePath, publicId);

        await fs.unlink(file.tempFilePath);

        return result.secure_url;
      })
    );

    return handleSuccess(
      res,
      {
        urls: results,
        uuid: baseUUID,
      },
      "File upload successful",
      200
    );
  } catch (error) {
    console.error("Upload Error:", error);
    return handleError(res, error, "File upload failed", 500);
  }
};
