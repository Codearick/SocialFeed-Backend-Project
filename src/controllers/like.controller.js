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
            likedBy: req.user._id
        }
    )

    if (toggleVideoLike) {
        await toggledVideoLike.remove();
    } else {
        try {
            toggledVideoLike = await Like.create({ video: videoId, likedBy: req.user._id });
        } catch (error) {
            // Handle the error
            console.error("Error toggling video like:", error);
            throw new ApiError(500, "Error toggling the video like. Please try again later.");
        }
    }

    const liked = !!toggledVideoLike; // Convert to boolean
    const message = liked ? "Video like toggled on successfully!" : "Video like toggled off successfully!"
    return res.status(200).json(new ApiResponse(200, liked, message));
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

    if (toggledCommentLike) {
        await toggledCommentLike.remove();

    } else {
        try {
            toggledCommentLike = await Like.create({ comment: commentId, likedBy: req.user._id });
        } catch (error) {
            // Handle the error
            console.error("Error toggling comment like:", error);
            throw new ApiError(500, "Error toggling the comment like. Please try again later.");
        }
    }

    const liked = !!toggledCommentLike;
    const message = liked ? "Comment like toggled on Successfully" : "Comment like toggled off successfully!"

    return res.status(200).json(new ApiResponse(200, liked, message));

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

    if (toggledTweetLike) {
        await toggledTweetLike.remove();

    } else {
        try {
            toggledTweetLike = await Like.create({ tweet: tweetId, likedBy: req.user._id });
        } catch (error) {
            // Handle the error
            console.error("Error toggling tweet like:", error);
            throw new ApiError(500, "Error toggling the tweet like. Please try again later.");
        }
    }

    const liked = !!toggledTweetLike;
    const message = liked ? "Tweet like toggled on Successfully" : "Tweet like toggled off successfully!"

    return res.status(200).json(new ApiResponse(200, liked, message));
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;

    const likedVideo = await Like.aggregate([
        {
            $match: {
                likedBy: userId
            }
        },
        {
            $project: {
                video: 1,
                comment: 0,
                tweet: 0,
            }
        }
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
