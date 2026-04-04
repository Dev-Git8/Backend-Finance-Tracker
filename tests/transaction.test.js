import request from "supertest";
import app from "../src/app.js";
import { jest } from "@jest/globals";
import prisma from "../src/config/db.js";
import jwt from "jsonwebtoken";
import { config } from "../src/config/db.js";

describe("Transaction Endpoints", () => {
    let adminToken, viewerToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 1 }, config.JWT_SECRET);
        viewerToken = jwt.sign({ id: 2 }, config.JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/transactions", () => {
        it("should allow ADMIN to create transaction", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, role: "ADMIN", status: "ACTIVE" });
            jest.spyOn(prisma.transaction, "create").mockResolvedValue({ id: 10, amount: 100, type: "INCOME" });

            const res = await request(app)
                .post("/api/transactions")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({ amount: 100, type: "INCOME", category: "Salary" });

            expect(res.statusCode).toBe(201);
            expect(res.body.transaction.amount).toBe(100);
        });

        it("should deny VIEWER from creating transaction", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, role: "VIEWER", status: "ACTIVE" });

            const res = await request(app)
                .post("/api/transactions")
                .set("Cookie", [`accessToken=${viewerToken}`])
                .send({ amount: 100, type: "INCOME", category: "Salary" });

            expect(res.statusCode).toBe(403);
        });
    });

    describe("GET /api/transactions", () => {
        it("should allow anyone to read transactions", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, role: "VIEWER", status: "ACTIVE" });
            jest.spyOn(prisma.transaction, "findMany").mockResolvedValue([{ id: 10, amount: 100 }]);
            jest.spyOn(prisma.transaction, "count").mockResolvedValue(1);

            const res = await request(app)
                .get("/api/transactions")
                .set("Cookie", [`accessToken=${viewerToken}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.transactions).toHaveLength(1);
        });
    });
});
