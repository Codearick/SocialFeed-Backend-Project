import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const healthCheck = asyncHandler( async(_, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    const response = new ApiResponse(200, {}, "This is a health check and your health is Okaishh!");
    return res.status(200).json(response);
})

export {healthCheck} 
