import Router from "mongoose";
import {
    getChannelStats,
    getChannelVideos
} from "../controllers/dashboard.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.user(verifyJWT);

router.route("/stats").get(getChannelStats)
router.route("/videos").get(getChannelVideos)

export default router;