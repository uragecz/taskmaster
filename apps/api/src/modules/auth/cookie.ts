import type { CookieOptions, Response } from "express";
import { env } from "../../config/env";
import { signToken } from "./jwt";

const COOKIE_NAME = "token";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions: CookieOptions = {
  httpOnly: true, // not readable from JS -> safe against XSS
  secure: env.cookieSecure, // Secure by default in production (HTTPS)
  sameSite: "lax", // same-site requests carry it -> CSRF protection
  maxAge: MAX_AGE_MS,
  path: "/",
};

/** Issues a fresh auth token and stores it in the httpOnly cookie. */
export function setAuthCookie(res: Response, userId: number): void {
  res.cookie(COOKIE_NAME, signToken(userId), cookieOptions);
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

/** Reads the auth token from a raw Cookie header (e.g. a WebSocket handshake). */
export function readTokenCookie(cookieHeader?: string): string | undefined {
  for (const part of cookieHeader?.split(";") ?? []) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
