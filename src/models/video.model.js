import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema(
    {
        videoFile: {
            type: {
                url: String,
                public_id: String,
            }, //Cloudinary 

            required: [true, "Video is required"],
        },
        thumbnail: {
            type: {
                url: String,
                public_id: String,
            }, //Cloudinary 

            required: [true, "thumbnail is required"],
        },
        title: {
            type: String,
            required: [true, "title is required"],
        },
        description: {
            type: String,
        },
        duration: {
            type: Number, //Cloudinary 
            required: true
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
    { timestamps: true }
)

videoSchema.index(
    { title: "text", description: "text" },
    { name: "search-videos", weights: { title: 3, description: 1 } }
)

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)
