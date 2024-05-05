import mongoose from "mongoose"
import { Comment } from "../models/comment.model"
import { ApiResonse, ApiResponse} from "../utils/ApiResponse"
import { ApiError} from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {page = 1, limit = 15} = req.query

    if(!videoId){
        throw new ApiError(404, "Video Id is required!");
    }

    const pipeline = [
        {$match : {videoId: mongoose.Types.ObjectId(videoId) }},
        {$sort: { createdAt: -1 }}
    ];

    const options = {page: parseInt(page), limit: parseInt(limit)};

    const comment = await Comment.aggregatePaginate(pipeline, options);

    if(!comment){
        throw new ApiError(500, "Failed to retrieve comments")
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comments retrived successfully!"));

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    const owner = req.user._id;

    if (!videoId || !owner || !content) {
        throw new ApiError(400, "Video ID, content, and user ID are required to add a comment.");
    }


    const comment = await Comment.create(
        {
            content: content,
            video: videoId,
            owner: owner
        }
    )

    if (!comment){
        throw new ApiError(500, "Failed to create a comment!")
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment created successfully!"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if(!commentId){
        throw new ApiError(404, "Comment Id is required!")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        {new: true}
    )

    if(!updatedComment){
        throw new ApiError(500, "Failed to update your comment!")
    }

    return res.status(200).json(new ApiResonse(200, updatedComment, "Comment updated successfully!"));
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if(!commentId){
        throw new ApiError(404, "Comment id is required!")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId, {new: true});

    if(!deletedComment){
        throw new ApiError(404, "Failed to delete the comment")
    }

    return res.status(200).json(new ApiResonse(200, deletedComment, "Comment deleted Successfully!"));
    
})
