import { Router } from "express";
import { register, login, refreshAccessToken, logout, getme } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter = Router();

// Public routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh-token", refreshAccessToken);

// Protected routes
authRouter.post("/logout", authMiddleware, logout);
authRouter.get("/get-me", authMiddleware, getme);

export default authRouter;
