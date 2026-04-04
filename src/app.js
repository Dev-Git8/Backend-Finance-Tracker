import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import transactionRouter from "./routes/transaction.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/dashboard", dashboardRouter);

export default app;