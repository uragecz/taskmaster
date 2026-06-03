import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // Override the auth cookie `Secure` flag; defaults to on in production.
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  // Secure cookies by default in production; an HTTP-only environment (e.g. the
  // local docker-compose) can opt out with COOKIE_SECURE=false.
  cookieSecure: data.COOKIE_SECURE
    ? data.COOKIE_SECURE === "true"
    : data.NODE_ENV === "production",
};
