import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

dotenv.config();

const databaseURL = process.env.DATABASE_URL;

if (!databaseURL) throw new Error("Database URL is missing.");

const adapter = new PrismaPg({ connectionString: databaseURL });

export const db = new PrismaClient({ adapter });
