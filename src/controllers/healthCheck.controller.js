import {ApiError} from "../utils/ApiError"
import {ApiResponse} from "../utils/ApiResponse"
import {asyncHandler} from "../utils/asyncHandler"

const healthCheck = asyncHandler( async(req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message

    return res.status(OK).json(new ApiResponse(200, {}, "This is a health check and your health is Okaishh!"));
})

export {healthCheck} 
