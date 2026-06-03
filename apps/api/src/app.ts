import { RequestContext } from "@mikro-orm/core";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { getORM } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter, authLimiter } from "./middleware/rateLimiters";
import { requireAuth } from "./middleware/requireAuth";
import { authRouter } from "./modules/auth/routes";
import { todoRouter } from "./modules/todos/routes";

export function createApp(): Express {
  const app = express();

  // Trust the single proxy hop (Caddy) so req.ip is the real client address,
  // which the per-IP auth limiter keys on — not the proxy's IP.
  app.set("trust proxy", 1);

  app.use(pinoHttp({ logger }));
  app.use(helmet());
  // credentials: true so the browser sends/receives the auth cookie.
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  // Fresh MikroORM identity map per request (avoids sharing one EntityManager).
  app.use((_req, _res, next) => RequestContext.create(getORM().em, next));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // BE owns clean routes; the `/api` prefix is stripped by the gateway (Caddy)
  // in production and by a Next.js rewrite in development.
  app.use("/auth", authLimiter, authRouter);
  // apiLimiter runs after requireAuth so it can key on req.userId.
  app.use("/todos", requireAuth, apiLimiter, todoRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
