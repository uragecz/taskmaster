import { RequestContext } from "@mikro-orm/core";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { getORM } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  // Fresh MikroORM identity map per request (avoids sharing one EntityManager).
  app.use((_req, _res, next) => RequestContext.create(getORM().em, next));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Feature routes are mounted here (Fáze 1+).
  // app.use("/api/todos", todoRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
