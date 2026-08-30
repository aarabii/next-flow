import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  TRIGGER_SECRET_KEY: z.string().optional(),
  TRIGGER_PROJECT_ID: z.string().optional(),
  TRANSLOADIT_KEY: z.string().optional(),
  TRANSLOADIT_SECRET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GEMINI_SECRET_KEY,
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
  TRIGGER_PROJECT_ID: process.env.TRIGGER_PROJECT_ID,
  TRANSLOADIT_KEY: process.env.TRANSLOADIT_KEY,
  TRANSLOADIT_SECRET: process.env.TRANSLOADIT_SECRET,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
});
