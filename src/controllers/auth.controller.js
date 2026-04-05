import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/db.js";

// Cookie options
const accessTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth", // only sent to auth routes
};

// Helper: generate tokens
function generateAccessToken(userId) {
    return jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, config.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}

// Helper: Master Token & Session Generator
async function generateAuthResponse(user, req, res, statusCode, message) {
    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Session table
    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            userAgent: req.headers["user-agent"] || null,
            ipAddress: req.ip || null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });

    // Set cookies
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return res.status(statusCode).json({
        message,
        accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
}

// ==================== REGISTER ====================
export async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userAlreadyExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userAlreadyExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // Automatically generate session, tokens, and return response
        return await generateAuthResponse(user, req, res, 201, "User registered successfully");
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== LOGIN ====================
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.status === "INACTIVE") {
            return res.status(403).json({ message: "Account is inactive" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Automatically generate session, tokens, and return response
        return await generateAuthResponse(user, req, res, 200, "User logged in successfully");
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== REFRESH TOKEN ====================
export async function refreshAccessToken(req, res) {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        // Verify the refresh token
        const decoded = jwt.verify(token, config.REFRESH_TOKEN_SECRET);

        // Check if refresh token exists in the database
        const session = await prisma.session.findUnique({
            where: { refreshToken: token },
        });

        if (!session) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        // Check if session has expired
        if (new Date() > session.expiresAt) {
            await prisma.session.delete({ where: { id: session.id } });
            return res.status(401).json({ message: "Refresh token has expired" });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(decoded.id);

        return res.status(200).json({ 
            message: "Access token refreshed successfully",
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== LOGOUT ====================
export async function logout(req, res) {
    try {
        const token = req.cookies.refreshToken;

        // Delete the session from database if refresh token exists
        if (token) {
            await prisma.session.deleteMany({
                where: { refreshToken: token },
            });
        }

        // Clear refresh cookie
        res.clearCookie("refreshToken", refreshTokenCookieOptions);

        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ==================== GET ME ====================
export async function getme(req, res) {
    return res.status(200).json({ user: req.user });
}