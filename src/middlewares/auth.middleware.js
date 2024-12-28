import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
export const verifyJWT = asyncHandler(async (req, _, next) => {
    // Retrieve the Authorization header from the incoming request
    // The header typically has the format: "Bearer <token>"
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user // we add user in req because this is middleware we can use user in our controllers
        next()
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid access token")
    }
})