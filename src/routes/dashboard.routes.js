import { Router } from "express";
import {
    getSummary,
    getCategorySummary,
    getTrends,
    getRecentTransactions,
} from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const dashboardRouter = Router();


dashboardRouter.use(authMiddleware);


dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/recent", getRecentTransactions);
dashboardRouter.get("/category-summary", getCategorySummary);
dashboardRouter.get("/trends", getTrends);

export default dashboardRouter;
