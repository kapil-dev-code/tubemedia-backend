import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../models/video.model.js"
import { deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { getMediaDuration } from "../utils/getMediaDuration.js"
import { uploadFileToCloudinary } from "../utils/uploadFileToCloudinary.js"
import mongoose from "mongoose"
const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description, duration = 1 } = req.body
    if (!title || !description) {
        throw new ApiError(400, "All fields are required")
    }
    const isMediaFile = (file) => file?.mimetype?.startsWith("video/") || file?.mimetype?.startsWith("audio/");
    const isImageFile = (file) => file?.mimetype?.startsWith("image/");

    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile || !isMediaFile(videoFile)) {
        throw new ApiError(400, "Invalid file");
    }

    if (!thumbnailFile || !isImageFile(thumbnailFile)) {
        throw new ApiError(400, "Invalid file");
    }

    const videoPath = videoFile.path;
    const thumbnailPath = thumbnailFile.path;
    const videoDuration = duration || await getMediaDuration(videoPath)
    const videoUrl = await uploadFileToCloudinary(videoPath, "video")
    const thumbnailUrl = await uploadFileToCloudinary(thumbnailPath, "thumbnail")

    const uploadedVideo = await Video.create({
        title,
        description,
        duration: videoDuration,
        videoFile: videoUrl,
        thumbnail: thumbnailUrl,
        videoUploader: req.user.id,
    })
    if (!uploadedVideo) {
        throw new ApiError(500, "Something went wrong while uploading the video")
    }
    return res.status(201).json(
        new ApiResponse(200, uploadedVideo, "video uploaded successfully")
    )
})

const getAllPaginatedVideo = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, title, isPublished, sort = "-createdAt" } = req.query;
    const pipeline = []
    if (title?.trim()) {
        pipeline.push({ $match: { title: { $regex: title, $options: "i" } } })
    }
    if (isPublished !== undefined) {
        pipeline.push({ $match: { isPublished: isPublished === "true" } })
    }
    pipeline.push({
        $sort: {
            [sort.replace("-", "")]: sort.startsWith("-") ? -1 : 1
        }
    });

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        customLabels: {
            totalDocs: "totalVideos",
            docs: "videos",
            limit: "perPage",
            page: "currentPage",
            totalPages: "totalPages",
        },
    };
    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    if (!videos) {
        throw new ApiError(500, "Something went wrong while fetching the video")
    }

    return res.status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})
const getSingleVideo = asyncHandler(async (req, res) => {
    const { id } = req.params
    const video = await Video.findById(id)
    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))

})
const getVideosByUploader = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const video = await Video.find({ videoUploader: userId }).populate("videoUploader", "userName fullName avatar")
    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))

})
const deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params
    const video = await Video.findOne({ _id: id, videoUploader: req.user._id })
    if (!video) {
        throw new ApiError(403, "You are not authorized to delete this video or it doesn't exist");
    }
    await video.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));

})
export { uploadVideo, getAllPaginatedVideo, getSingleVideo, getVideosByUploader, deleteVideo }