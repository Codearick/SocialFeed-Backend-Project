import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
)

tweetSchema.index(
    { content: "text", owner: "text" },
    { name: "search_tweeter", weights: { content: 3, owner: 1 } }
);

tweetSchema.plugin(mongooseAggregatePaginate)
export const Tweet = mongoose.model("Tweet", tweetSchema)