import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const adapter = new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
const prisma = new PrismaClient({ adapter });

if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not defined");
}

if(!process.env.REFRESH_TOKEN_SECRET){
    throw new Error("REFRESH_TOKEN_SECRET is not defined");
}

const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL
}

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

export default prisma;
export { connectDB, config };
