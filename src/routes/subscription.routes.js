import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware";
import { toggleSubscription } from "../controllers/subscription.controller";
const router = Router()

router.post("/subscribe", verifyJWT, toggleSubscription);
export default router