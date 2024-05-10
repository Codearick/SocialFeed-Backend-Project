import mongoose from "mongoose";
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"


const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;

    const totalVideoViews = await Video.aggregate([
        {
            $match: {
                owner: channelId
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        },
        {
            $addFields: {
                totalViews: "$totalViews"
            }
        }
    ]);

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: subscriber,
                foreignField: "_id",
                as: "totalSubscriber",
            }
        },
        {
            $project: { $size: "$totalSubscriber" }
        },
        {
            $addFields: { totalSubscribers: "$totalSubscribers" }
        },
        {
            $project: { _id: 0, totalSubscribers: 1 }
        }
    ]);

    const totalVideos = await Video.aggregate([
        {
            $match: {
                owner: channelId
            }
        },
        {
            $count: "totalVideos"
        },
        {
            $addFields: { totalVideos: "$totalVideos" }
        },
        {
            $project: { _id: 0, totalVideos: 1 }
        }
    ]);

    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "channelVideos"
            }
        },
        {
            $unwind: "$channelVideos"
        },
        {
            $match: {
                "channelVideos.owner": channelId
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "channelVideos._id",
                foreignField: "video",
                as: "likedVideos"
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: { $size: "$likedVideos" } }
            }
        },
        {
            $addFields: {
               totalLikes: "$totalLikes"
            }
        }
    ]);

    const channelStats = {
        totalVideoViews: totalVideoViews || 0, 
        totalSubscribers: totalSubscribers || 0, 
        totalVideos: totalVideos || 0, 
        totalLikes: totalLikes || 0
    };

    return res.status(200).json(new ApiResponse(200, channelStats, "Channel stats retrieved successfully!"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user._id;

    const channelVideos = await Video.find({ channelId });

    if (channelVideos.length < 1) {
        throw new ApiError(500, "Channel has no videos.");
    }

    return res.status(200).json(new ApiResponse(200, channelVideos, "All the videos retrieved successfully!"))

})

export {
    getChannelStats,
    getChannelVideos
}
