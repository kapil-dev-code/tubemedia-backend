import { Router } from "express"
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory, deleteUserCoverImage ,deleteUser, userEmailVerification, resendOtp,resetPassword, confirmResetPassword} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
const router = Router()

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1 // only one image
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)
router.route('/verify').post(userEmailVerification)
router.route('/resend').post(resendOtp)
router.route("/login").post(loginUser)

// secured routes
router.route("/me").delete(verifyJWT, deleteUser);
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/reset-password").post(resetPassword)
router.route("/confirm-reset-password/:token").post(confirmResetPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/me/cover-image").delete(verifyJWT, deleteUserCoverImage)

router.route("/c/:userName").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)

export default router