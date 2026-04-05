import { Router } from "express";
import {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
} from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const transactionRouter = Router();


transactionRouter.use(authMiddleware);

// --- Transactions CRUD ---
transactionRouter.get("/", getTransactions);
transactionRouter.get("/:id", getTransactionById);
transactionRouter.post("/", createTransaction);
transactionRouter.put("/:id", updateTransaction);
transactionRouter.delete("/:id", deleteTransaction);

export default transactionRouter;
