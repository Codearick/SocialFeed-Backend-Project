import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
        //TODO: get all videos based on query, sort, pagination

        if (!userId) {
            throw new ApiError(404, "User id is required!")
        }

        const pipeline = []; //

        if (query && userId) {
            pipeline.push({
                $match: {
                    ...query,
                    owner: userId
                }
            })
        } else if (!query && userId) {
            pipeline.push({
                $match: {
                    owner: userId
                }
            })
        }

        pipeline.push(
            { $skip: (page - 1) * limit },
            { $limit: limit }
        );

        if (sortBy && sortType) {
            const sortStage = { $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 } }
            pipeline.push(sortStage);
        }

        const videos = await Video.aggregate.paginate(pipeline)
        return res.status(200).json(new ApiResponse(200, videos, "Vidoes fetched successfully!"))

    } catch (error) {
        throw new ApiError(500, "Error paginating vidoes!")
    }

})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    console.log("I AM IN PUBLISH VIDEO ROUTE")
    if (!title) {
        throw new ApiError(401, "Title is mandatory!")
    }
    console.log("THIS IS REQ.FILES :: ", req.files)

    const videoFileLocalPath = req.files?.videoFiles[0]?.path;
    console.log("THIS IS VIDEOFILES ARRAY ::", req.files.videoFiles)
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video File is required!")
    }

    let thumbnailLocalPath;
    if (req.files.thumbnail && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    const cloudinaryVideo = await uploadOnCloudinary(videoFileLocalPath);
    const cloudinaryThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!cloudinaryVideo || !cloudinaryThumbnail) {
        throw new ApiError(500, "Something went wrong while uploading video!")
    }

    const video = await Video.create(
        {
            videoFile: cloudinaryVideo.url,
            thumbnail: cloudinaryThumbnail?.url,
            title,
            description,
            duration: cloudinaryVideo.duration,
            owner: req.user._id
        }
    )

    const uploadedVideo = await Video.findById(video._id)
    if (!uploadedVideo) {
        throw new ApiError(500, "Something went wrong while uploading video!!")
    }

    return res.status(200).json(new ApiResponse(200, uploadedVideo, "Video published successfully!"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(404, "Video Id is required!");
    }

    try {
        const video = await Video.findById({ _id: videoId });

        console.log("RESPONSE FROM MONGOOSE AFTER FINDBYID :: ", video);

        if (!video) {
            throw new ApiError(500, "Cannot find the video with that id");
        }

        return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully!"));
    } catch (error) {
        throw new ApiError(500, message = error.msessage || "Internal Server Error!")
    }

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    
    if(!title && title.length < 2){
        throw new ApiError(400, "Title is required!")
    }

    let thumbnailLocalPath ;

    if(req.files?.thumbnail && req.files?.thumbnail.length > 0 && Array.isArray(req.files.thumbnail)){
        const oldVideo = await Video.findById({_id: videoId});
        if (!oldVideo) {
            throw new ApiError(404, "Video not found");
        }

        const oldVideoThumbnailUrl = oldVideo.thumbnail;
        const deleteOldVideoThumbnail = await deleteOnCloudinary(oldVideoThumbnailUrl);
        if(!deleteOldVideoThumbnail){
            throw new ApiError(500, "Failed to delete old video thumbnail");
        }

        thumbnailLocalPath = req.files.thumbnail[0].path
    }

    const cloudinaryThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!cloudinaryThumbnail){
        throw new ApiError(500, "Failed to upload new thumbnail to Cloudinary")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: cloudinaryThumbnail.url,
                title,
                description: description || " "
            }
        },
        {new : true}
    )

    if(!video){
        throw new ApiError(500, "Failed to update the video!")
    }

    return res.status(200).json(new ApiResponse(200, {video}, "Video updated successfully!"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const deletedVideo = await Video.findByIdAndDelete({_id : videoId})

    if(!deletedVideo){
        throw new ApiError(404, "Video not found!")
    }

    const deleteCloudinaryThumbnail = await deleteOnCloudinary(deletedVideo.thumbnail);
    const deleteCloudinaryVideo = await deleteOnCloudinary(deletedVideo.videoFile);

    if(!deleteCloudinaryThumbnail || !deleteCloudinaryVideo){
        throw new ApiError(500, "Failed to delete video on cloudinary!")
    }
    

    return res.status(200).json(200, {deletedVideo}, "Video Deleted Successfully!")
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400,"Video id is needed!")
    }

    const video = await Video.findById({_id: videoId})

    if(!video){
        throw new ApiError(404, "Video not found!")
    }

    video.isPublished = !video.isPublished;

    const updatedToggle = await video.save();


    return res.status(200).json(new ApiResponse(200, {updatedToggle}, "Publish Status toggled successfully!"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

