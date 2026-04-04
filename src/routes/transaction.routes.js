import { Router } from "express";
import {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
} from "../controllers/transaction.controller.js";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware.js";

const transactionRouter = Router();

// All routes require authentication
transactionRouter.use(authMiddleware);

// ==================== READ ROUTES ====================
// VIEWER, ANALYST, ADMIN can read
transactionRouter.get(
    "/",
    authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
    getTransactions
);

transactionRouter.get(
    "/:id",
    authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
    getTransactionById
);

// ==================== WRITE ROUTES ====================
// Only ADMIN can create, update, or delete
transactionRouter.post(
    "/",
    authorizeRoles("ADMIN"),
    createTransaction
);

transactionRouter.put(
    "/:id",
    authorizeRoles("ADMIN"),
    updateTransaction
);

transactionRouter.delete(
    "/:id",
    authorizeRoles("ADMIN"),
    deleteTransaction
);

export default transactionRouter;
