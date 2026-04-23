import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Defensive Environment Validation
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];
REQUIRED_ENV.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(` Critical Error: ${key} is not defined in .env`);
    }
});

// 2. Docs-Aligned Shorthand (Prisma 7)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 3. Configuration Object
const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL
};

// 4. Manual Connection Utility (Good for early error catching)
async function connectDB() {
  try {
    await prisma.$connect();
    console.log(" Database connected successfully");
  } catch (error) {
    console.error(" Database connection failed:", error.message);
    process.exit(1);
  }
}

export default prisma;
export { connectDB, config };
