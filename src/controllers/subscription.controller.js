import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    const userId = req.user._id;

    const subscription = await Subscription.findOne({ subscriber: userId, channel: subscriberId });

    if (!subscription) {
        // If the subscription doesn't exists, create it
        const toggleOn = await Subscription.create({ subscriber: userId, channel: subscriberId });
        // Send response
        return res.status(200).json(new ApiResponse(200, toggleOn, "Channel subscribed successfully!"));
    } 

    // If the subscription exist, delete subscription. 
    const toggleOff = await Subscription.findByIdAndDelete(subscription._id);
    return res.status(200).json(new ApiResponse(200, toggleOff, "Channel unsubscribed successfully!"));

});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
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

    if (!subscribers) {
        throw new ApiError(500, "Something went wrong while getting subscribers list");
    }

    return res.status(200).json(new ApiResponse(200, subscribers, "Channel subscribers fetched successfully!"));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(404, "Please provide valid subscriber id")
    }

    const subscribedTo = await Subscription.aggregate([
        {
            $match: { subscriber: new mongoose.Types.ObjectId(`${subscriberId}`) }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                subscribedTo: 1,
                createdAt: 1
            }
        }
    ])

    if (!subscribedTo) {
        throw new ApiError(500, "Failed to retrieve subscribed channel list!")
    }

    return res.status(200).json(new ApiResponse(200, subscribedTo, "Subscribed channel list retrived successfully!"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
