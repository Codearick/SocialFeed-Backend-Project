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
    const { page = 1, limit = 10, query, sortBy, sortType, owner } = req.query;

    const pipeline = [];

    // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.content, owner, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in searching in content and owner providing faster search results
    // here the name of search index is 'search_tweeter'

    if (query) {
        pipeline.push({
            $search: {
                index: "search-tweeter",
                text: {
                    query: query,
                    path: ["content", "owner"] //search only on content, owner
                }
            }
        })
    }

    if (owner) {
        if (!isValidObjectId(owner)) {
            throw new ApiError(400, "Invalid userId");
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(owner)
            }
        });
    }

    if (sortBy && sortType) {
        const sortStage = { $sort: { [sortBy]: sortType == "asc" ? 1 : -1 } };
        pipeline.push(sortStage);
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
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
            },
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const tweetAggregate = await Tweet.aggregate(pipeline);

    if (!tweetAggregate || tweetAggregate.length === 0) {
        return res.status(404).json(new ApiResponse(404, tweetAggregate, "No videos found for the specified criteria"));
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const paginatedTweets = await Tweet.aggregatePaginate(tweetAggregate, options);

    // Merge ownerDetails into paginatedVideos
    const tweetWithOwnerDetails = paginatedTweets.docs.map(video => {
        const ownerDetails = tweetAggregate.find(agg => agg.owner.toString() === video.owner.toString())?.ownerDetails;
        return { ...video, ownerDetails };
    });

    paginatedTweets.docs = tweetWithOwnerDetails;

    return res.status(200).json(new ApiResponse(200, paginatedTweets, "Tweet retrieved successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    try {
        const { tweetId } = req.params
        const { content } = req.body

        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweetId");
        }

        if (!content || content.length < 1 || content.trim() == "") {
            throw new ApiError(402, "Tweet required")
        }

        const tweet = await Tweet.findById(tweetId);

        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }

        if (tweet?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only owner can edit thier tweet");
        }

        const updateTweet = await Tweet.findByIdAndUpdate(
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

        if (!updateTweet) {
            throw new ApiError(500, "Something went wrong while updating tweet");
        }

        return res.status(200).json(new ApiResponse(200, updateTweet, "Tweet updated successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong while updating tweet")
    }

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Please provde valid tweetId!");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete thier tweet");
    }

    const deletedTweet = await Tweet.deleteOne(
        {
            _id: tweetId,
        }
    )
    if (!deletedTweet) {
        return new ApiError(500, "Something went wrong")
    }

    return res.status(200).json(new ApiResponse(200, { deletedTweet }, "Tweet deleted successfully!"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
