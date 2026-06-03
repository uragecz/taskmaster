import type { Request, RequestHandler } from "express";
import { verifyToken } from "../modules/auth/jwt";
import { HttpError } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/** Reads the JWT from the httpOnly cookie and attaches the user id. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    throw new HttpError(401, "Authentication required");
  }

  try {
    req.userId = verifyToken(token).sub;
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  next();
};

/** The authenticated user's id. Safe after requireAuth has run. */
export function getUserId(req: Request): number {
  return req.userId as number;
}
