import express from "express";
import {authController} from "../controllers/authController.js";
const router = express.Router();

const { login, logoutUser, getRefreshToken, resetPassword, newPassword } = authController  

router.post("/login", login)
router.post("/logout", logoutUser)
router.get("/refresh", getRefreshToken);
router.post("/reset-password", resetPassword);
router.patch("/new-password/:token", newPassword);


export default router
