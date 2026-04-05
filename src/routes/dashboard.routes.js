import { Router } from "express";
import {
    getSummary,
    getCategorySummary,
    getTrends,
    getRecentTransactions,
} from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const dashboardRouter = Router();

// Option B: Maximum Privacy
// ALL routes strictly require authentication, but DO NOT require specific roles.
// The controllers will enforce that every user can only view their OWN dashboard data.
dashboardRouter.use(authMiddleware);

// --- Dashboard Insights ---
dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/recent", getRecentTransactions);
dashboardRouter.get("/category-summary", getCategorySummary);
dashboardRouter.get("/trends", getTrends);

export default dashboardRouter;
