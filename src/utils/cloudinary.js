import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const uploadResult = await cloudinary.uploader
            .upload(
                localFilePath, {
                resource_type: "auto", // auto handled any type of file
            }
            )
        console.log("File url after upload successful", uploadResult?.url)
        fs.unlinkSync(localFilePath)
        return uploadResult
    }
    catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
        return null
    }
}
const extractPublicIdFromUrl = (url) => {
    if (!url) return null;
    
    const segments = url.split('/');
    const publicIdWithExtension = segments.pop();  // Get the last part of the URL, which contains public ID and extension
    const publicId = publicIdWithExtension.split('.')[0];  // Remove the file extension
    
    return publicId;
};


const deleteFromCloudinary = async (imageUrl) => {
    try {
        const publicId = extractPublicIdFromUrl(imageUrl); // Extract public ID from URL
        
        if (!publicId) {
            return null;  // If no public ID, return null
        }
        
        // Delete the image from Cloudinary
        const result = await cloudinary.v2.uploader.destroy(publicId);
        return result;
    } catch (error) {
        return null;
    }
};

export { uploadOnCloudinary,deleteFromCloudinary }

