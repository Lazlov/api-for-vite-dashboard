import express from "express";
import { emailController } from "../controllers/emailController.js";

const router = express.Router();

const { activateUser, resendActivationToken } = emailController;

router.patch("/activate/:link", activateUser);
router.post("/resendtoken/:link", resendActivationToken);

export default router;
