import { Router } from "express";

import  {healthCheck}  from "../controllers/healthCheck.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT)

router.route("/").get(healthCheck);

export default router
