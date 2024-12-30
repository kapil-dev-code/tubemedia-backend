import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { uploadVideo, getAllPaginatedVideo, getVideosByUploader, deleteVideo, watchVideo } from "../controllers/video.controller.js"
import { optionalJWT } from "../middlewares/optionalAuth.middleware.js"
const router = Router()

router.route("/upload").post(verifyJWT, upload.fields([
    {
        name: "video",
        maxCount: 1 // only one image
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), uploadVideo)

router.route("/").get(getAllPaginatedVideo)

router.route("/:id")
    .get(optionalJWT, watchVideo)
    .delete(verifyJWT, deleteVideo)

router.route("/uploader/:userId").get(getVideosByUploader)
export default router
