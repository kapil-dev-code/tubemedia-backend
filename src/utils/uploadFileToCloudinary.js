import { ApiError } from "./ApiError.js";
import { uploadOnCloudinary } from "./cloudinary.js";
export const uploadFileToCloudinary = async (filePath, fieldName) => {
    if (!filePath) throw new ApiError(400, `${fieldName} file is required`);
    const uploadResponse = await uploadOnCloudinary(filePath);
    if (!uploadResponse?.url) throw new ApiError(400, `Failed to upload ${fieldName}`);
    return uploadResponse.url;
};