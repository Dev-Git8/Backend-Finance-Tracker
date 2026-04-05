import request from "supertest";
import app from "../src/app.js";
import { jest } from "@jest/globals";
import prisma from "../src/config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../src/config/db.js";

describe("Auth Endpoints", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/auth/register", () => {
        it("should register a new user and return tokens in cookies", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
            jest.spyOn(prisma.user, "create").mockResolvedValue({
                id: 1, name: "Test User", email: "test@example.com", role: "VIEWER"
            });
            jest.spyOn(prisma.session, "create").mockResolvedValue({});

            const res = await request(app)
                .post("/api/auth/register")
                .send({ name: "Test User", email: "test@example.com", password: "password123" });

            expect(res.statusCode).toBe(201);
            expect(res.body.user.email).toBe("test@example.com");
            expect(res.headers["set-cookie"]).toBeDefined();
        });

        it("should return 400 if email is already taken", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2 });

            const res = await request(app)
                .post("/api/auth/register")
                .send({ name: "Test User", email: "existing@example.com", password: "password123" });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("User already exists");
        });
    });

    describe("POST /api/auth/login", () => {
        it("should login with valid credentials", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
                id: 1, name: "Test", email: "test@example.com", password: await bcrypt.hash("password123", 10), status: "ACTIVE"
            });
            jest.spyOn(prisma.session, "create").mockResolvedValue({});

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "test@example.com", password: "password123" });

            expect(res.statusCode).toBe(200);
            expect(res.headers["set-cookie"]).toBeDefined();
        });

        it("should return 401 with invalid password", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
                id: 1, name: "Test", email: "test@example.com", password: await bcrypt.hash("pass", 10), status: "ACTIVE"
            });

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "test@example.com", password: "wrongpassword" });

            expect(res.statusCode).toBe(401);
        });
    });

    describe("GET /api/auth/get-me", () => {
        it("should return user data for valid token", async () => {
            const token = jwt.sign({ id: 1 }, config.JWT_SECRET);
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
                id: 1, name: "Test", email: "test@example.com", role: "VIEWER", status: "ACTIVE"
            });

            const res = await request(app)
                .get("/api/auth/get-me")
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user.email).toBe("test@example.com");
        });
    });
});
