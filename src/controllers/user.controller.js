import prisma from "../config/db.js";

// ==================== LIST USERS ====================
// Only ADMIN can access
export async function getUsers(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await prisma.user.findMany({
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const totalUsers = await prisma.user.count();

        return res.status(200).json({
            users,
            pagination: {
                total: totalUsers,
                page,
                limit,
                totalPages: Math.ceil(totalUsers / limit),
            },
        });
    } catch (error) {
        console.error("GetUsers error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== GET SINGLE USER ====================
// Only ADMIN can access
export async function getUserById(req, res) {
    try {
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error("GetUserById error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== UPDATE USER ROLE ====================
// Only ADMIN can access
export async function updateUserRole(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        if (isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        if (!["VIEWER", "ANALYST", "ADMIN"].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be VIEWER, ANALYST, or ADMIN" });
        }

        // Prevent admin from demoting themselves (optional safety check)
        if (userId === req.user.id && role !== "ADMIN") {
            return res.status(403).json({ message: "Admins cannot demote themselves. Ask another admin." });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return res.status(200).json({
            message: "User role updated successfully",
            user,
        });
    } catch (error) {
        console.error("UpdateUserRole error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== UPDATE USER STATUS ====================
// Only ADMIN can access
export async function updateUserStatus(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { status } = req.body;

        if (isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be ACTIVE or INACTIVE" });
        }

        if (userId === req.user.id && status === "INACTIVE") {
            return res.status(403).json({ message: "You cannot deactivate your own account" });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { status },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
            },
        });

        // If deactivated, we could optionally delete their sessions from db here
        if (status === "INACTIVE") {
            await prisma.session.deleteMany({
                where: { userId: user.id }
            });
        }

        return res.status(200).json({
            message: "User status updated successfully",
            user,
        });
    } catch (error) {
        console.error("UpdateUserStatus error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}
