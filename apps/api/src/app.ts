import { RequestContext } from "@mikro-orm/core";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { getORM } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/requireAuth";
import { authRouter } from "./modules/auth/routes";
import { todoRouter } from "./modules/todos/routes";

export function createApp(): Express {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(helmet());
  // credentials: true so the browser sends/receives the auth cookie.
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(cookieParser());

  // Per-IP rate limit (after auth this should key on the user / org instead,
  // and move to a shared Redis store once running on multiple replicas).
  if (env.NODE_ENV !== "test") {
    app.use(
      rateLimit({
        windowMs: 60_000,
        limit: 100,
        standardHeaders: "draft-7",
        legacyHeaders: false,
      }),
    );
  }

  app.use(express.json());

  // Fresh MikroORM identity map per request (avoids sharing one EntityManager).
  app.use((_req, _res, next) => RequestContext.create(getORM().em, next));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // BE owns clean routes; the `/api` prefix is stripped by the gateway (Caddy)
  // in production and by a Next.js rewrite in development.
  app.use("/auth", authRouter);
  app.use("/todos", requireAuth, todoRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
