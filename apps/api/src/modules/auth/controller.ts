import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env";
import { getORM } from "../../db";
import { User } from "../../entities/User";
import { HttpError } from "../../middleware/errorHandler";
import { asyncHandler } from "../../utils/asyncHandler";
import { signToken } from "./jwt";
import { AuthService } from "./service";
import { loginSchema, registerSchema } from "./validation";

const COOKIE_NAME = "token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions: CookieOptions = {
  httpOnly: true, // not readable from JS -> safe against XSS
  secure: env.cookieSecure, // Secure by default in production (HTTPS)
  sameSite: "lax", // same-site requests carry it -> CSRF protection
  maxAge: SEVEN_DAYS_MS,
  path: "/",
};

function publicUser(user: User) {
  return { id: user.id, email: user.email };
}

const service = (): AuthService => new AuthService(getORM().em);

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const user = await service().register(input);
  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.status(201).json(publicUser(user));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const user = await service().login(input);
  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.json(publicUser(user));
});

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(204).send();
};

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getORM().em.findOne(User, { id: req.userId });
  if (!user) throw new HttpError(401, "Unauthorized");
  res.json(publicUser(user));
});
