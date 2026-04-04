import { Router } from "express";
import {
    getSummary,
    getCategorySummary,
    getTrends,
    getRecentTransactions,
} from "../controllers/dashboard.controller.js";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware.js";

const dashboardRouter = Router();

// All routes require authentication
dashboardRouter.use(authMiddleware);

// ==================== DASHBOARD ROUTES ====================

// VIEWER, ANALYST, ADMIN
dashboardRouter.get(
    "/summary",
    authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
    getSummary
);

dashboardRouter.get(
    "/recent",
    authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
    getRecentTransactions
);

// ANALYST, ADMIN only (more advanced insights)
dashboardRouter.get(
    "/category-summary",
    authorizeRoles("ANALYST", "ADMIN"),
    getCategorySummary
);

dashboardRouter.get(
    "/trends",
    authorizeRoles("ANALYST", "ADMIN"),
    getTrends
);

export default dashboardRouter;
