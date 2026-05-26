import { loadEnvFile } from "node:process";
import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Load .env when running locally; in Railway env vars are injected directly.
try {
  loadEnvFile();
} catch {
  // no .env file — running in production environment
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
