import Router from "express"
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT);

router.route("/c/:subscriberId").post(toggleSubscription).get(getSubscribedChannels)

router.route("/u/:channelId").get(getUserChannelSubscribers)

export default router