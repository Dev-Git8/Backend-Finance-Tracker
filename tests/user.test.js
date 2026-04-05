import request from "supertest";
import app from "../src/app.js";
import { jest } from "@jest/globals";
import prisma from "../src/config/db.js";
import jwt from "jsonwebtoken";
import { config } from "../src/config/db.js";

describe("User Endpoints", () => {
    let adminToken, viewerToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 1 }, config.JWT_SECRET);
        viewerToken = jwt.sign({ id: 2 }, config.JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/users", () => {
        it("should return users for ADMIN", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, role: "ADMIN", status: "ACTIVE" });
            jest.spyOn(prisma.user, "findMany").mockResolvedValue([{ id: 2, name: "User 2" }]);
            jest.spyOn(prisma.user, "count").mockResolvedValue(1);

            const res = await request(app)
                .get("/api/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.users).toHaveLength(1);
        });

        it("should return 403 for VIEWER", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, role: "VIEWER", status: "ACTIVE" });

            const res = await request(app)
                .get("/api/users")
                .set("Authorization", `Bearer ${viewerToken}`);

            expect(res.statusCode).toBe(403);
        });
    });

    describe("PATCH /api/users/:id/role", () => {
        it("should allow ADMIN to update role", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, role: "ADMIN", status: "ACTIVE" });
            jest.spyOn(prisma.user, "update").mockResolvedValue({ id: 3, role: "ANALYST" });

            const res = await request(app)
                .patch("/api/users/3/role")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ role: "ANALYST" });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.role).toBe("ANALYST");
        });
    });
});
