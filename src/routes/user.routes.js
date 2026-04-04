import { Router } from "express";
import { getUsers, getUserById, updateUserRole, updateUserStatus } from "../controllers/user.controller.js";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// All user management routes require ADMIN role
userRouter.use(authMiddleware);
userRouter.use(authorizeRoles("ADMIN"));

userRouter.get("/", getUsers);
userRouter.get("/:id", getUserById);
userRouter.patch("/:id/role", updateUserRole);
userRouter.patch("/:id/status", updateUserStatus);

export default userRouter;
