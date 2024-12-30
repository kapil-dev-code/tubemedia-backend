import mongoose, { Schema } from "mongoose"

const emailVerificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    otp: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "15m"
    }
})

export const EmailVerification = mongoose.model("EmailVerification", emailVerificationSchema)