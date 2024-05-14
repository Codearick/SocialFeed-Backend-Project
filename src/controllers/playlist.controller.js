import mongoose, {isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler( async(req, res) => {
    const {name, description } = req.body
    const owner = req.user._id;

    if(!name || name.length <= 0){
        throw new ApiError(404, "Please enter valid playlist name");
    }

    const playlist = await Playlist.create(
        {
            name: name, 
            description: description || "",
            owner: owner
        }
    )

    if(!playlist){
        throw new ApiError(500, "Something went wrong while creating playlist!")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist created successfully!"))
})

const getUserPlaylists = asyncHandler( async(req, res) =>{
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(404, "Please provide valid userId!")
    }

    const playlists = await Playlist.find({owner: userId});

    if(!playlists){
        throw new ApiError(500, "Something went wrong while getting retrieving playlists")
    }
    if(playlists.length < 1 || playlists.length == 0){
        throw new ApiError(400, "User doesn't have any playlist")
    }

    return res.status(200).json(new ApiResponse(200, playlists, "Playlists retrieved successfully!"))
})

const getPlaylistById = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(404, "Please provide the valid object id!")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(500, "Something went wrong while retrieving the playlist!")
    } else if(playlist.length == 0){
        throw new ApiError(404, "The playlist doesn't exits!")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist retrieved successfully!"))
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params

    if(!(isValidObjectId(playlistId)) || !(isValidObjectId(videoId))){
        throw new ApiError("Please provide the valid IDs!")
    }

    const addPlaylist = await Playlist.findByIdAndUpdate(
        playlistId, 
        {
            $push: {
                videos: videoId
            }
        },
        {new: true}
    )

    if(!addPlaylist){
        throw new ApiError(500, "Something went wrong while adding video to playlist!")
    }

    return res.status(200).json(new ApiResponse(200, addPlaylist, "Video added successfully to a playlist!"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!(isValidObjectId(playlistId)) || !(isValidObjectId(videoId))){
        throw new ApiError(404, "Please provide valid IDs")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId, 
        {
            $pull: {
                videos: videoId
            }
        },
        {new: true}
    );

    if(!playlist){
        throw new ApiError(400, "Something went wrong while deleting video from a playlist!")
    }

    return res.status(200).json(200, playlist, "Video deleted successfully from a playlist!");
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!(isValidObjectId(playlistId))){
        throw new ApiError(404, "Please provide a valid playlistId");
    }

    const playlist = await Playlist.findByIdAndDelete({_id: playlistId});

    if(!playlist){
        throw new ApiError(500, "Something went wrong while deleting a playlist!")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted successfully!"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!(isValidObjectId(playlistId))){
        throw new ApiError(404, "Please provide valid playlist id!")
    }
    if(name.length < 3 || !name){
        throw new ApiError(403, "Please provide valid name!")
    }

    const playlist = await findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name, 
                description: description || " "
            }
        },
        {new: true}
    )

    if(!playlist){
        throw new ApiError(500, "Something went wrong while updating the playlist!")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully!"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}