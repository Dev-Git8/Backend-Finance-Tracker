import request from "supertest";
import app from "../src/app.js";
import { jest } from "@jest/globals";
import prisma from "../src/config/db.js";
import jwt from "jsonwebtoken";
import { config } from "../src/config/db.js";

describe("Dashboard Endpoints", () => {
    let analystToken, viewerToken;

    beforeAll(() => {
        analystToken = jwt.sign({ id: 1 }, config.JWT_SECRET);
        viewerToken = jwt.sign({ id: 2 }, config.JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/dashboard/summary", () => {
        it("should return income and expense summary", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, role: "VIEWER", status: "ACTIVE" });
            
            // Mock aggregate for both calls
            const aggregateMock = jest.spyOn(prisma.transaction, "aggregate");
            aggregateMock.mockResolvedValueOnce({ _sum: { amount: 5000 } }); // INCOME
            aggregateMock.mockResolvedValueOnce({ _sum: { amount: 2000 } }); // EXPENSE

            const res = await request(app)
                .get("/api/dashboard/summary")
                .set("Cookie", [`accessToken=${viewerToken}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.summary.totalIncome).toBe(5000);
            expect(res.body.summary.totalExpenses).toBe(2000);
            expect(res.body.summary.netBalance).toBe(3000);
        });
    });

    describe("GET /api/dashboard/category-summary", () => {
        it("should allow ANALYST access", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, role: "ANALYST", status: "ACTIVE" });
            jest.spyOn(prisma.transaction, "groupBy").mockResolvedValue([{ category: "Food", type: "EXPENSE", _sum: { amount: 100 } }]);

            const res = await request(app)
                .get("/api/dashboard/category-summary")
                .set("Cookie", [`accessToken=${analystToken}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.categorySummary).toHaveLength(1);
        });

        it("should deny VIEWER access", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, role: "VIEWER", status: "ACTIVE" });

            const res = await request(app)
                .get("/api/dashboard/category-summary")
                .set("Cookie", [`accessToken=${viewerToken}`]);

            expect(res.statusCode).toBe(403);
        });
    });
});
