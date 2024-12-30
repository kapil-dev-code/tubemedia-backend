import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadFileToCloudinary } from "../utils/uploadFileToCloudinary.js"
import { sendEmailVerificationCode, sendForgetPasswordEmail } from "../utils/sendEmailVerification.js"
import { EmailVerification } from "../models/emailVerification.modal.js"

export const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        // update refresh token
        user.refreshToken = refreshToken
        // save change in db
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500,
            "Something went wrong while generating refresh and access token"
        )
    }
}

const validateFields = (fields) => {
    const missingField = fields.find((field) => !field?.trim());
    if (missingField) throw new ApiError(400, "All fields are required");
};

const checkUserExists = async (email, userName) => {
    const user = await User.findOne({
        $or: [{ email: email?.toLowerCase() }, { userName: userName?.toLowerCase() }]
    });
    if (user) throw new ApiError(409, "User with email or username already exists");
    return false;
};



export const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exist : username, email
    // check for images, check for avatar
    // upload them to cloudinary , avatar
    // create user object - crete entry in db
    // remove password and refresh token field form response
    // check for user creation 
    // return res
    const { fullName, email, userName, password } = req.body

    validateFields([fullName, email, userName, password]);

    await checkUserExists(email, userName);

    // multer is provide us files form req 
    const avatarPath = req.files?.avatar?.[0]?.path;
    const coverImagePath = req.files?.coverImage?.[0]?.path;
    const avatarUrl = await uploadFileToCloudinary(avatarPath, "Avatar");
    const coverImageUrl = coverImagePath
        ? await uploadFileToCloudinary(coverImagePath, "Cover Image")
        : "";

    const newUser = await User.create({
        fullName,
        email: email?.toLowerCase(),
        userName: userName?.toLowerCase(),
        password,
        avatar: avatarUrl,
        coverImage: coverImageUrl
    });
    await sendEmailVerificationCode(req, newUser)
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken,-deletionDate")
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully please verify otp")
    )
})

export const userEmailVerification = asyncHandler(async (req, res) => {
    const { email, otp } = req.body
    if (!email || !otp) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(400, "Email done not exist")
    }
    if (user.isVerified) {
        throw new ApiError(400, "Email is already verified")
    }
    const emailVerification = await EmailVerification.findOne(({ userId: user._id, otp }))
    if (!emailVerification) {
        throw new ApiError(400, "Invalid or expired verification code");
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();
    await EmailVerification.deleteMany({ _id: emailVerification._id });

    return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
})
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body
    if (!email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(400, "Email done not exist")
    }
    if (user.isVerified) {
        throw new ApiError(400, "Email is already verified")
    }
    await sendEmailVerificationCode(req, user)
    return res.status(200).json(new ApiResponse(200, {}, "Verification email resent successfully"));

})

export const loginUser = asyncHandler(async (req, res) => {
    // req body-> data
    // userName or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, userName, password } = req.body
    if (!(userName || email)) {
        throw new ApiError(400, "Username or password is required")
    }
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    }) // this alow give custom methods that is define in User schema

    if (!user) {
        throw new ApiError(400, "User does not exist")
    }
    if (!user?.isVerified) {
        throw new ApiError(400, "Your account is not verified")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    if (user?.deletionDate) {
        user.deletionDate = null;
        await user.save();
    }
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // modify only server
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged In Successfully"))
})

export const logoutUser = asyncHandler(async (req, res) => {
    // req.user we get this form auth middleware
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true // this gives new value that is return in res
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id)
        console.log(refreshToken, accessToken)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully"

                )
            )
    } catch (error) {
        console.log(error)
        throw new ApiError(401, "Invalid refresh token")
    }

})

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)// coming from auth middleware
    if (!user) {
        throw new ApiError(400, "User does not exist")
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: true }) // because we save this then this call pre method of userModel
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})

export const resetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    if (!email) {
        throw new ApiError(400, "Email is required")
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(400, "Email address does not exist")
    }
    const resetToken = await user.generateResetToken()
    await sendForgetPasswordEmail(user, resetToken)
    return res.status(200).json(new ApiResponse(200, {}, "Reset password link send to your email please confirm password"))
})
export const confirmResetPassword = asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (!token) {
        throw new ApiError(400, "Token is required");
    }

    if (!password || !confirmPassword) {
        throw new ApiError(400, "Password and confirm password are required");
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password do not match");
    }

    let decodedToken;
    try {
        decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }

    const user = await User.findById(decodedToken._id);
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    user.password = password; 
    await user.save();

    return res.status(200).json(new ApiResponse(200,{},"Password has been reset successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user
    res
        .status(200)
        .json(new ApiResponse(200, user, "Current user fetched successfully"))
})
export const deleteUser = asyncHandler(async (req, res) => {
    const deletionDate = new Date();
    deletionDate.setMonth(deletionDate.getMonth() + 1);
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { deletionDate } },
        { new: true }
    );

    return res.status(200)
        .json(new ApiResponse(200, { deletionDate }, "User marked for deletion after one month"))
})

// export const cancelUserDeletion = asyncHandler(async (req, res) => {
//     try {
//         const userId = req.user?._id;
//         const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             { $unset: { deletionDate: "" } },
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json(new ApiResponse(404, null, "User not found"));
//         }

//         return res.status(200).json(
//             new ApiResponse(200, {}, "User deletion request canceled successfully")
//         );
//     } catch (error) {
//         console.error("Error canceling user deletion:", error);
//         return res.status(500).json(new ApiResponse(500, null, "An error occurred"));
//     }
// });


export const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email,
                fullName
            }
        },
        {
            new: true,           // Return the updated document
            runValidators: true, // Trigger custom validators
            context: 'query'     // Necessary for some Mongoose validators
        }
    ).select("-password")
    res
        .status(200)
        .json(new ApiResponse(200, user, "Account details update successfully"),)
})

export const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const user = await User.findById(req.user?._id).select("avatar");

    if (user?.avatar) {
        await deleteFromCloudinary(user.avatar);
    }
    const avatarUrl = await uploadFileToCloudinary(avatarLocalPath, "avatar")

    const updatedUser = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatarUrl
            }
        },
        { new: true }
    ).select("-password")
    return res.status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar image updated successfully"))
})
export const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover  file is missing")
    }
    const user = await User.findById(req.user?._id).select("coverImage");
    if (user?.coverImage) {
        await deleteFromCloudinary(user.coverImage);
    }
    const coverImageUrl = await uploadFileToCloudinary(coverImageLocalPath, "cover-image")

    const updatedUser = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImageUrl
            }
        },
        { new: true }
    ).select("-password")
    return res.status(200)
        .json(new ApiResponse(200, updatedUser, "Cover image updated successfully"))
})
export const deleteUserCoverImage = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id).select("coverImage");
    if (user?.coverImage) {
        await deleteFromCloudinary(user.coverImage);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: ""
            }
        },
        { new: true, runValidators: true }
    ).select("-password")
    return res.status(200)
        .json(new ApiResponse(200, updatedUser, "Cover image deleted successfully"))
})

export const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { userName } = req.params
    if (!userName?.trim()) {
        throw new ApiError(400, "Username is missing")
    }
    const channel = await User.aggregate([{
        $match: { userName: userName?.toLowerCase() }
    },
    {
        $lookup: {
            from: "Subscriptions",// model name in which we want watch and model name save with extra "s" in db so add s et the end of Subscription
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"

        }
    },
    {
        $lookup: {
            from: "Subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },
    {
        $addFields: {
            subscribersCount: {
                $size: "$subscribers"
            },
            channelSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: { in: [req.user?._id, "$subscribers.subscriber"] },// check usr?._id is present in subscribers.subscriber 
                    then: true,
                    else: false

                }
            }
        }
    },
    {
        $project: {
            fullName: 1,
            userName: 1,
            subscribersCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1

        }
    }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "Channel done not exists")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, channel?.[0], "User channel fetched successfully")
        )
})

export const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        // Step 1: Match the current user's ID from the request
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user?._id)
                // Converts string ID from request into ObjectId to match with MongoDB's _id field.
            }
        },

        // Step 2: Lookup the user's watch history (referencing the 'videos' collection)
        {
            $lookup: {
                from: "videos",  // Looking up the 'videos' collection
                localField: "watchHistory",  // 'watchHistory' is an array of video IDs in the user document
                foreignField: "_id",  // We're matching the IDs in 'watchHistory' with the '_id' field of the 'videos' collection
                as: "watchHistory",  // The result will be stored in the 'watchHistory' field as an array of video documents
                pipeline: [  // Here, we specify additional stages to process the data further
                    // Step 3: Lookup the 'owner' of each video from the 'Users' collection
                    {
                        $lookup: {
                            from: "Users",  // Looking up the 'Users' collection to get owner details of each video
                            localField: "owner",  // The 'owner' field of each video references the User's ID
                            foreignField: "_id",  // Matching the 'owner' field in video with '_id' in the 'Users' collection
                            as: "owner",  // This will store the owner data in an array named 'owner'
                            pipeline: [  // Further processing of the 'owner' field
                                // Step 4: Project the required fields for the owner (fullName, userName, avatar)
                                {
                                    $project: {
                                        fullName: 1,  // Including 'fullName' in the output
                                        userName: 1,  // Including 'userName' in the output
                                        avatar: 1     // Including 'avatar' in the output
                                    }
                                }
                            ]
                        }
                    },
                    // Step 5: Add fields to select the first (and only) owner from the 'owner' array
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"  // Because 'owner' is an array, we extract the first element (as there's usually only one)
                            }
                        }
                    }
                ]
            }
        }
    ]);
    return res.status(200)
        .json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"))
})