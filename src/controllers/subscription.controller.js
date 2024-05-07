import mongoose, { isValidObjectId } from "mongoose";
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    const subscription = await Subscription.findOne({ subscriber: userId, channel: channelId });

    if (subscription) {
        // If the subscription exists, remove it
        await subscription.remove();
    } else {
        // If the subscription doesn't exist, create a new one
        try {
            await Subscription.create({ subscriber: userId, channel: channelId });
        } catch (error) {
            console.error("Error toggling subscription:", error);
            throw new ApiError(500, "Error while toggling the subscription!");
        }
    }

    // Determine the result and message
    const toggledOn = !!subscription;
    const message = toggledOn ? "Subscription toggled on successfully" : "Subscription toggled off successfully";

    // Send response
    return res.status(200).json(new ApiResponse(200, toggledOn, message));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(404, "Please provide valid channel id!")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "subscriber",
                as: "subscriberList",
                pipeline: [{
                    $project: {
                        username: 1,
                        fullname: 1,
                        email: 1,
                        avatar: 1,
                    }
                }]
            }
        },
        {
            $project: {
                subscriberList: 1,
                createdAt: 1
            }
        }
    ])

    if(!subscribers){
        throw new ApiError(500, "Something went wrong while getting subscribers list");
    }

    return res.status(200).json(new ApiResponse(200, subscribers, "Channel subscribers fetched successfully!"));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if( !subscriberId ){
        throw new ApiError(404, "Please provide valid subscriber id")
    }

    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}