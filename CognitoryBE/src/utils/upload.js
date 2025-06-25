import { v2 as cloudinary } from "cloudinary";

export const upload = async (file, publicId) => {
  try {
    const options = {
      folder: "Cognitory",
      resource_type: "auto",
    };

    if (publicId) {
      options.public_id = publicId; // Use provided public ID
    }

    const result = await cloudinary.uploader.upload(file, options);
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};
