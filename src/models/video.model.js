import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String,    // cloudinary url
        required: true,  // required field
    },
    thumbnail: {
        type: String,    // cloudinary url
        required: true,  // required field
    },
    title: {
        type: String,    // data type
        required: true,  // required field
        trim: true,  // remove white spaces
        index: true // for faster search
    },
    description: {
        type: String,    // data type
        required: true,  // required field
        trim: true,  // remove white spaces
    },
    duration: {
        type: Number,    // data type
        required: true,  // required field
    },
    views: {
        type: Number,    // data type
        default : 0  
    },
    isPublished: {
        type: Boolean,    // data type
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
},
{
    timestamps: true
}
)

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema)
// Compare this snippet from src/controllers/auth.controller.js: