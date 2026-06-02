import type { RequestHandler } from "express";

/**
 * Wraps an async route handler so any rejection is forwarded to Express'
 * error middleware instead of crashing the process. Keeps controllers free
 * of repetitive try/catch.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
