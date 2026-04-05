import prisma from "../config/db.js";

// ==================== GET SUMMARY ====================
// Access: All Authenticated Users (Option B)
export async function getSummary(req, res) {
    try {
        const baseWhere = req.user.role === "VIEWER" ? { userId: req.user.id } : {};

        // Aggregate totals natively through Prisma/PostgreSQL
        const incomeResult = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: "INCOME", ...baseWhere },
        });

        const expenseResult = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: "EXPENSE", ...baseWhere },
        });

        const totalIncome = incomeResult._sum.amount || 0;
        const totalExpenses = expenseResult._sum.amount || 0;
        const netBalance = totalIncome - totalExpenses;

        return res.status(200).json({
            summary: {
                totalIncome,
                totalExpenses,
                netBalance,
            },
        });
    } catch (error) {
        console.error("GetSummary error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== GET CATEGORY SUMMARY ====================
// Access: All Authenticated Users (Option B)
export async function getCategorySummary(req, res) {
    try {
        const { type } = req.query; // optional filter by INCOME or EXPENSE

        const where = req.user.role === "VIEWER" ? { userId: req.user.id } : {};
        if (type) {
            if (!["INCOME", "EXPENSE"].includes(type.toUpperCase())) {
                return res.status(400).json({ message: "Type must be INCOME or EXPENSE" });
            }
            where.type = type.toUpperCase();
        }

        const categoryGroup = await prisma.transaction.groupBy({
            by: ["category", "type"],
            _sum: { amount: true },
            where,
            orderBy: {
                _sum: { amount: "desc" },
            },
        });

        const formattedSummary = categoryGroup.map((item) => ({
            category: item.category,
            type: item.type,
            total: item._sum.amount,
        }));

        return res.status(200).json({ categorySummary: formattedSummary });
    } catch (error) {
        console.error("GetCategorySummary error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== GET TRENDS ====================
// Access: All Authenticated Users (Option B)
export async function getTrends(req, res) {
    try {
        // PostgreSql specific - fetch all transactions and process in memory is simplest
        // for generic use case. Alternatively, raw SQL query can be written for DATE_TRUNC.
        
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
        
        const baseWhere = req.user.role === "VIEWER" ? { userId: req.user.id } : {};
        
        const transactionsThisYear = await prisma.transaction.findMany({
            where: {
                ...baseWhere,
                date: {
                    gte: startOfYear
                }
            },
            select: {
                amount: true,
                type: true,
                date: true
            }
        });

        // Group by month
        const trends = {};
        for(let i = 0; i < 12; i++) {
            // Month string e.g. "2024-01"
            const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            trends[monthStr] = { income: 0, expense: 0 };
        }

        transactionsThisYear.forEach(tx => {
            const mIdx = tx.date.getMonth();
            const monthStr = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}`;
            
            if (tx.type === "INCOME") {
                trends[monthStr].income += tx.amount;
            } else {
                trends[monthStr].expense += tx.amount;
            }
        });

        // Convert object to array sorted by month
        const formattedTrends = Object.keys(trends).sort().map(month => ({
            month,
            income: trends[month].income,
            expense: trends[month].expense,
            net: trends[month].income - trends[month].expense
        }));

        return res.status(200).json({ trends: formattedTrends });
    } catch (error) {
        console.error("GetTrends error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== GET RECENT TRANSACTIONS ====================
// Access: All Authenticated Users (Option B)
export async function getRecentTransactions(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const where = req.user.role === "VIEWER" ? { userId: req.user.id } : {};

        const recent = await prisma.transaction.findMany({
            where,
            take: limit,
            orderBy: { date: "desc" },
            include: { user: { select: { name: true } } },
        });

        return res.status(200).json({ recent });
    } catch (error) {
        console.error("GetRecentTransactions error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
