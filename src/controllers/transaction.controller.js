import prisma from "../config/db.js";

// ==================== CREATE TRANSACTION ====================
// Access: All Authenticated Users (Hybrid: Option C)
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
                userId: req.user.id, // Record the creator
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
// Access: All Authenticated Users (Hybrid: Option C)
export async function getTransactions(req, res) {
    try {
        const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;

        // Build filter object (Analysts/Admins see all)
        const where = req.user.role === "VIEWER" ? { userId: req.user.id } : {};

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
// Access: All Authenticated Users (Hybrid: Option C)
export async function getTransactionById(req, res) {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        const where = req.user.role === "VIEWER" ? { id, userId: req.user.id } : { id };

        // Use findFirst to handle both roles safely
        const transaction = await prisma.transaction.findFirst({
            where,
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
// Access: VIEWERS (own), ADMIN (any), ANALYSTS (Blocked - Option C)
export async function updateTransaction(req, res) {
    try {
        // Analysts are Read-Only!
        if (req.user.role === "ANALYST") {
            return res.status(403).json({ message: "Analysts have read-only access." });
        }

        const id = parseInt(req.params.id);
        const { amount, type, category, date, description } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        if (type && !["INCOME", "EXPENSE"].includes(type)) {
            return res.status(400).json({ message: "Type must be INCOME or EXPENSE" });
        }

        const where = req.user.role === "VIEWER" ? { id, userId: req.user.id } : { id };

        // Verify existence/ownership before updating
        const existingTx = await prisma.transaction.findFirst({ where });

        if (!existingTx) {
            return res.status(404).json({ message: "Transaction not found or access denied" });
        }

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                amount: amount !== undefined ? parseFloat(amount) : undefined,
                type,
                category,
                date: date ? new Date(date) : undefined,
                description,
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
// Access: VIEWERS (own), ADMIN (any), ANALYSTS (Blocked - Option C)
export async function deleteTransaction(req, res) {
    try {
        // Analysts are Read-Only!
        if (req.user.role === "ANALYST") {
            return res.status(403).json({ message: "Analysts have read-only access." });
        }

        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }

        const where = req.user.role === "VIEWER" ? { id, userId: req.user.id } : { id };

        // Use deleteMany to safely enforce ownership/existence
        const deleted = await prisma.transaction.deleteMany({ where });

        if (deleted.count === 0) {
            return res.status(404).json({ message: "Transaction not found or access denied" });
        }

        return res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("DeleteTransaction error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Transaction not found" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}
