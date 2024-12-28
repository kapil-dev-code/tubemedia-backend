import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Subscription } from "../models/subscription.model";
import { ApiResponse } from "../utils/ApiResponse";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channel } = req.body
    const subscriber = req.user?._id
    if (!channel || subscriber.toString() === channel.toString()) {
        throw new ApiError(400, "Invalid subscription request")
    }

    const subscription = await Subscription.findOne({ channel, subscriber })
    if (subscription) {
        await Subscription.deleteOne({ channel, subscriber })
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"))
    }
    else {
        const newSubscription = await Subscription.create({ channel, subscriber })
        return res.status(200).json(new ApiResponse(200, newSubscription, "Subscribed successfully"))
    }
})

export { toggleSubscription }