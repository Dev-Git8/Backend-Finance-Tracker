import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { config } from "../config/db.js";

export async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
            },
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid token. User not found." });
        }

        if (user.status === "INACTIVE") {
            return res.status(403).json({ message: "Account is inactive." });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired." });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token." });
        }
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}

export function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied. Insufficient permissions." });
        }
        next();
    };
}
