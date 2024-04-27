import { Router } from "express";

import { healthCheck } from "../controllers/healthCheck.controller"
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT)

router.route("/").get(healthCheck);
