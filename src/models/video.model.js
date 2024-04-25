import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //Cloudinary 
            required: ["true", "Video is required"],
        },
        thumbnail: {
            type: String, //Cloudinary 
            required: ["true", "Video is required"],
        },
        title: {
            type: String, 
            required: ["true", "Video is required"],
        },
        description: {
            type: String, 
            required: ["true", "Video is required"],
        },
        duration: {
            type: Number, //Cloudinary 
            required: "true"
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {timestamps: true}
)

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video",videoSchema)