import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";

/** Throwable HTTP error carrying a status code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** 404 fallback for unmatched routes. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not Found" });
};

/** Central error handler — keeps route code free of try/catch boilerplate. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  logger.error(err);
  res.status(500).json({ error: "Internal Server Error" });
};
