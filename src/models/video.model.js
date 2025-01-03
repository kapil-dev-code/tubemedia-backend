import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema({
    videoFile: {
        type: String,// cloudinary url
        required: [true, "Video is required"]
    },
    thumbnail: {
        type: String,// cloudinary url
        required: [true, "Thumbnail is required"]
    },
    title: {
        type: String,
        index: true,
        required: [true, "Title is required"]
    },
    description: {
        type: String,
        required: [true, "Description is required"]
    },
    duration: {
        type: Number, // cloudinary
        required: [true, "Duration is required"]
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    videoUploader: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true,
    }
},
    {
        timestamps: true
    }
)
videoSchema.plugin(mongooseAggregatePaginate) // add this before export and this is must because are going to use aggregate for this model and add pagination 
export const Video = mongoose.model("Video", videoSchema)