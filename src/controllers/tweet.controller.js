import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body

    if (!content || content?.trim().length < 1) {
        throw new ApiError(400, "Content is required!")
    }

    const tweet = await Tweet.create(
        {
            owner: req.user?._id,
            content
        },
    )

    if (!tweet) throw new ApiError(500, "Something went wrong while creating tweet")

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created successfully!"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { owner } = req.params;

    console.log("ownerId is: ::", owner)

    if (!owner) {
        throw new ApiError(400, "Id is missing")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(owner)
            }
         }
        
    ])

    if (!userTweets || userTweets.length < 1) {
        throw new ApiError(401, "No tweets to show")
    }

    // Respond with the user tweets
    return res.status(200).json(new ApiResponse(200, userTweets, "User tweets retrieved successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    try {
        const { tweetId } = req.params
        const { content } = req.body
    
        if (!tweetId) {
            throw new ApiError(400, "No id for this tweet found")
        }
    
        if (!content || content.length < 1 || content.trim() == "") {
            throw new ApiError(402, "Tweet required")
        }
    
        const tweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content: content
                }
            },
            {
                new: true
            }
        )
    
        if(!tweet){
            throw new ApiError(500, "Something went wrong while updating tweet");
        }
    
        return res.status(200).json(new ApiResponse(200, tweet._update, "Tweet updated successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong while updating tweet")
    }

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!tweetId) {
        throw new ApiError(404, "This tweet doesn't exits");
    }

    const tweet = await Tweet.deleteOne(
        {
            _id: tweetId,
        }
    )
    if(!tweet){
        return new ApiError(500, "Something went wrong")
    }
    console.log(tweet, " :: This tweet is deleted!")

    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully!"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
