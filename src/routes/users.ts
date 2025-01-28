import express from "express";
import { userController } from "../controllers/userController.js";

const router = express.Router();

const { getUsers, deleteUser, updateUser, createUser } = userController;

router.get("/", getUsers);

router.post("/", createUser);

router.delete("/:id", deleteUser);

router.patch("/:id", updateUser);

export default router;
