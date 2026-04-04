import prisma from "../config/db.js";

// ==================== CREATE TRANSACTION ====================
// Access: ADMIN only
export async function createTransaction(req, res) {
    try {
        const { amount, type, category, date, description } = req.body;

        if (amount === undefined || !type || !category) {
            return res.status(400).json({ message: "Amount, type, and category are required" });
        }

        if (!["INCOME", "EXPENSE"].includes(type)) {
            return res.status(400).json({ message: "Type must be INCOME or EXPENSE" });
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                type,
                category,
                date: date ? new Date(date) : undefined,
                description,
                userId: req.user.id, // Record which admin created this
            },
        });

        return res.status(201).json({
            message: "Transaction created successfully",
            transaction,
        });
    } catch (error) {
        console.error("CreateTransaction error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== LIST TRANSACTIONS ====================
// Access: VIEWER, ANALYST, ADMIN
export async function getTransactions(req, res) {
    try {
        const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;

        // Build filter object
        const where = {};

        if (type) {
            where.type = type.toUpperCase();
        }

        if (category) {
            where.category = { contains: category, mode: "insensitive" };
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const transactions = await prisma.transaction.findMany({
            where,
            skip,
            take,
            orderBy: { date: "desc" },
            include: {
                user: { select: { name: true, email: true } }, // Include creator info
            },
        });

        const total = await prisma.transaction.count({ where });

        return res.status(200).json({
            transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: take,
                totalPages: Math.ceil(total / take),
            },
        });
    } catch (error) {
        console.error("GetTransactions error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== GET SINGLE TRANSACTION ====================
// Access: VIEWER, ANALYST, ADMIN
export async function getTransactionById(req, res) {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true } },
            },
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        return res.status(200).json({ transaction });
    } catch (error) {
        console.error("GetTransactionById error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== UPDATE TRANSACTION ====================
// Access: ADMIN only
export async function updateTransaction(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { amount, type, category, date, description } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        if (type && !["INCOME", "EXPENSE"].includes(type)) {
            return res.status(400).json({ message: "Type must be INCOME or EXPENSE" });
        }

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                amount: amount !== undefined ? parseFloat(amount) : undefined,
                type,
                category,
                date: date ? new Date(date) : undefined,
                description,
                // optionally update the userId to track who modified it last:
                userId: req.user.id,
            },
        });

        return res.status(200).json({
            message: "Transaction updated successfully",
            transaction,
        });
    } catch (error) {
        console.error("UpdateTransaction error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Transaction not found" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== DELETE TRANSACTION ====================
// Access: ADMIN only
export async function deleteTransaction(req, res) {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        await prisma.transaction.delete({
            where: { id },
        });

        return res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("DeleteTransaction error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Transaction not found" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}
