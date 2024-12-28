import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const optionalJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();

        if (token) {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken._id).select("-password -refreshToken");

            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Skip attaching the user if the token is invalid
        console.warn("Optional JWT Middleware: Invalid or missing token");
    }
    next(); 
});
