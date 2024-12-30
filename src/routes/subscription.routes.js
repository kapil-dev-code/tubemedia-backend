import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription } from "../controllers/subscription.controller.js";
const router = Router()

router.post("/subscribe", verifyJWT, toggleSubscription);
export default router