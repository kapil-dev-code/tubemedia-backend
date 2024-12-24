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

export { uploadOnCloudinary }

