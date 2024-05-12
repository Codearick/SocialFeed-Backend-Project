import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(`${localFilePath}`, { resource_type: "auto" })
        //file has been uploaded
        //console.log("File is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the opereation got failed. 
        return null;
    }
}

const deleteOnCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        
        const response = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" })

        return response;

    } catch (error) {
        return "Failed to delete from cloudinary!";
    }
}

export { uploadOnCloudinary }
export { deleteOnCloudinary }

