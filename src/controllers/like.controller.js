import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video id!")
    }

    let toggledVideoLike = await Like.findOne(
        {
            video: videoId,
            likedBy: req.user?._id
        }
    )

    if (!toggledVideoLike) {
        try {
            const toggleOn = await Like.create({ video: videoId, likedBy: req.user._id });
            return res.status(200).json(new ApiResponse(200, toggleOn, "Video like toggled on successfully!"));
        } catch (error) {
            // Handle the error
            throw new ApiError(500, "Error toggling the video like. Please try again later.");
        }
    }

    const toggleOff = await Like.findByIdAndDelete(toggledVideoLike._id);
    return res.status(200).json(new ApiResponse(200, toggleOff, "Video like toggled off successfully!"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid comment id!")
    }

    let toggledCommentLike = await Like.findOne(
        {
            comment: commentId,
            likedBy: req.user._id
        }
    )

    if (!toggledCommentLike) {
        const toggleOn = await Like.create({ comment: commentId, likedBy: req.user._id });

        return res.status(200).json(new ApiResponse(200, toggleOn, "Comment like toggled on successfully!"));
    }

    const toggleOff = await Like.findByIdAndDelete(toggledCommentLike._id);
    return res.status(200).json(new ApiResponse(200, toggleOff, "Comment like toggled off successfully!"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweet id!")
    }

    let toggledTweetLike = await Like.findOne(
        {
            tweet: tweetId,
            likedBy: req.user._id
        }
    )

    if (!toggledTweetLike) {
        const toggleOn = await Like.create({ tweet: tweetId, likedBy: req.user._id });

        return res.status(200).json(new ApiResponse(200, toggleOn, "Tweet like toggled on successfully!"));
    }

    const toggleOff = await Like.findByIdAndDelete(toggledTweetLike._id);
    return res.status(200).json(new ApiResponse(200, toggleOff, "Tweet like toggled off successfully!"));

})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;

    const likedVideo = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                },
            },
        },
    ]);

    if (likedVideo.length === 0) {
        throw new ApiError(404, "No liked videos found for the user!");
    }

    return res.status(200).json(new ApiResponse(200, likedVideo, "Liked vidoes retrieved Successfully!"))

})


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}
