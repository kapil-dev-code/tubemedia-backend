import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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


const uploadFileToCloudinary = async (filePath, fieldName) => {
    if (!filePath) throw new ApiError(400, `${fieldName} file is required`);
    const uploadResponse = await uploadOnCloudinary(filePath);
    if (!uploadResponse?.url) throw new ApiError(400, `Failed to upload ${fieldName}`);
    return uploadResponse.url;
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

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
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
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

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
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
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
        const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user_id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken.options)
                .json(
                    new ApiResponse(
                        200,
                        { accessToken, refreshToken },
                        "Access token refreshed successfully"
    
                    )
                )
    } catch (error) {
        throw new ApiError(401,"Invalid refresh token")
    }
        
})