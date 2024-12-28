import mongoose, { Schema } from "mongoose";

const watchedVideoSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        videoId: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const WatchedVideo = mongoose.model("WatchedVideo", watchedVideoSchema);
