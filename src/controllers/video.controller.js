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

        const pipeline = [];
        // for using Full Text based search u need to create a search index in mongoDB atlas
        // you can include field mapppings in search index eg.title, description, as well
        // Field mappings specify which fields within your documents should be indexed for text search.
        // this helps in seraching only in title, desc providing faster search results
        // here the name of search index is 'search-videos'

        if (query) {
            pipeline.push({
                $search: {
                    index: "search-videos",
                    text: {
                        query: query,
                        path: ["title", "description"] //search only on title, desc
                    }
                }
            });
        }

        if (userId) {
            if (!isValidObjectId(userId)) {
                throw new ApiError(400, "Invalid userId");
            }

            pipeline.push({
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            });
        }
        // fetch videos only that are set isPublished as true
        pipeline.push({ $match: { isPublished: true } });

        if (sortBy && sortType) {
            const sortStage = { $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 } }
            pipeline.push(sortStage);
        }

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                "avatar.url": 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$ownerDetails"
            }
        )

        const videosAggregate = await Video.aggregate(pipeline);

        if (!videosAggregate || videosAggregate.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "No videos found for the specified criteria"));
        }

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };

        const videos = await Video.aggregatePaginate(videosAggregate, options)

        return res.status(200).json(new ApiResponse(200, videos, "Vidoes fetched successfully!"));

    } catch (error) {
        throw new ApiError(500, "Error paginating vidoes!")
    }

})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description, isPublished } = req.body
    // TODO: get video, upload to cloudinary, create video

    console.log("I AM IN PUBLISH VIDEO ROUTE")
    if (!title) {
        throw new ApiError(401, "Title is mandatory!")
    }
    console.log("THIS IS REQ.FILES :: ", req.files)

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    console.log("THIS IS VIDEOFILES ARRAY ::", req.files.videoFile)
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video File is required!")
    }

    let thumbnailLocalPath;
    if (req.files.thumbnail && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    const cloudinaryVideo = await uploadOnCloudinary(videoFileLocalPath);
    const cloudinaryThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    console.log(cloudinaryThumbnail);

    if (!cloudinaryVideo || !cloudinaryThumbnail) {
        throw new ApiError(500, "Something went wrong while uploading video!")
    }

    const video = await Video.create(
        {
            videoFile: {
                url: cloudinaryVideo.url,
                public_id: cloudinaryVideo.public_id
            },
            thumbnail: {
                url: cloudinaryThumbnail?.url,
                public_id: cloudinaryThumbnail?.public_id
            },
            title,
            description: description || "",
            duration: cloudinaryVideo.duration,
            owner: req.user._id,
            isPublished: isPublished
        }
    );

    const uploadedVideo = await Video.findById(video._id)
    if (!uploadedVideo) {
        throw new ApiError(500, "Something went wrong while uploading video!!")
    }

    return res.status(200).json(new ApiResponse(200, uploadedVideo, "Video published successfully!"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(404, "Video Id is required!");
    }

    try {
        const video = await Video.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $lookup: {
                                from: "subscriptions",
                                localField: "_id",
                                foreignField: "channel",
                                as: "subscribers"
                            }
                        },
                        {
                            $addFields: {
                                subscribersCount: {
                                    $size: "$subscribers"
                                },
                                isSubscribed: {
                                    $cond: {
                                        if: {
                                            $in: [req.user?._id, "$subscribers.subscriber"]
                                        },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                                subscribersCount: 1,
                                isSubscribed: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    likesCount: {
                        $size: "$likes"
                    },
                    owner: {
                        $first: "$owner"
                    },
                    isLiked: {
                        $cond: {
                            if: { $in: [req.user?._id, "$likes.likedBy"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    videoFile: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    createdAt: 1,
                    duration: 1,
                    comments: 1,
                    owner: 1,
                    likesCount: 1,
                    isLiked: 1,
                }
            }
        ]);

        if (!video || video.length === 0) {
            throw new ApiError(404, "Cannot find the video with that id");
        }

        await Video.findByIdAndUpdate(videoId,
            {
                $inc: {
                    views: 1
                }
            }
        );

        // add this video to user watch history
        await User.findByIdAndUpdate(req.user?._id, {
            $addToSet: {
                watchHistory: videoId
            }
        });

        return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully!"));
    } catch (error) {
        throw new ApiError(500, error.message || "Internal Server Error!")
    }

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;

    if (!title || title.length < 2) {
        throw new ApiError(400, "Title is required and must be at least 2 characters long.");
    }

    let thumbnailLocalPath;
    let cloudinaryThumbnail;

    let oldVideo = await Video.findById({ _id: videoId });
    
    if (!oldVideo) {
        throw new ApiError(404, "Video not found");
    }


    if (oldVideo?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError( 400, "You can't edit this video as you are not the owner" );
    }

    if (req.files?.thumbnail && req.files?.thumbnail.length > 0 && Array.isArray(req.files.thumbnail)) {

        const oldVideoThumbnailPublicId = oldVideo.thumbnail.public_id;
        const deleteOldVideoThumbnail = await deleteOnCloudinary(oldVideoThumbnailPublicId);
        if (!deleteOldVideoThumbnail) {
            throw new ApiError(500, "Failed to delete old video thumbnail");
        }

        thumbnailLocalPath = req.files.thumbnail[0].path
        cloudinaryThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if (!cloudinaryThumbnail) {
            throw new ApiError(500, "Failed to upload new thumbnail to Cloudinary")
        }
    }

    const updateObject = {
        $set: {
            title,
            description: description
        }
    };
    
    // Check if cloudinaryThumbnail exists
    if (cloudinaryThumbnail) {
        // If it exists, add thumbnail fields to the update object
        updateObject.$set.thumbnail = {
            url: cloudinaryThumbnail.url,
            public_id: cloudinaryThumbnail.public_id
        };
    }
    
    // Update the video document
    const video = await Video.findByIdAndUpdate(
        videoId,
        updateObject,
        { new: true }
    );

    if (!video) {
        throw new ApiError(500, "Failed to update the video!")
    }

    return res.status(200).json(new ApiResponse(200, { video }, "Video updated successfully!"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "video Id is missing")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You can't delete this video as you are not the owner");
    }

    const deletedVideo = await Video.findByIdAndDelete({ _id: videoId })

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found!")
    }

    console.log("THIS IS DELETED VIDEO RESPONSE ::", deletedVideo);

    const deleteCloudinaryThumbnail = await deleteOnCloudinary(deletedVideo.thumbnail.public_id);
    const deleteCloudinaryVideo = await deleteOnCloudinary(deletedVideo.videoFile.public_id);

    if (!deleteCloudinaryThumbnail || !deleteCloudinaryVideo) {
        throw new ApiError(500, "Failed to delete video on cloudinary!")
    }


    return res.status(200).json(200, { deletedVideo }, "Video Deleted Successfully!")
})

const togglePublishStatus = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You can't toogle publish status as you are not the owner");
    }

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
