import { loadEnvFile } from "node:process";
import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

let connectionString: string;

try {
  loadEnvFile();

  connectionString = process.env.DATABASE_URL as string;

  if (!connectionString) {
    throw new Error("DATABASE_URL não definida no arquivo .env");
  }

  console.log("Env carregado com sucesso");
} catch (error) {
  console.error("Erro ao carregar o arquivo .env:", error);
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
