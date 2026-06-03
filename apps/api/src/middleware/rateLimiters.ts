import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";

const skipInTest = (): boolean => env.NODE_ENV === "test";

/** Strict per-IP limit for public auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipInTest,
});

/** Per-user limit for the authenticated API (requireAuth runs first). */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.userId}`,
  validate: false, // we key on the user id, not the IP
  skip: skipInTest,
});
