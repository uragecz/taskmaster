import type { Request, Response } from "express";
import { getORM } from "../../db";
import { User } from "../../entities/User";
import { HttpError } from "../../middleware/errorHandler";
import { asyncHandler } from "../../utils/asyncHandler";
import { clearAuthCookie, setAuthCookie } from "./cookie";
import { AuthService } from "./service";
import { loginSchema, registerSchema } from "./validation";

function publicUser(user: User) {
  return { id: user.id, email: user.email };
}

const service = (): AuthService => new AuthService(getORM().em);

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const user = await service().register(input);
  setAuthCookie(res, user.id);
  res.status(201).json(publicUser(user));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const user = await service().login(input);
  setAuthCookie(res, user.id);
  res.json(publicUser(user));
});

export const logout = (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.status(204).send();
};

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getORM().em.findOne(User, { id: req.userId });
  if (!user) throw new HttpError(401, "Unauthorized");
  res.json(publicUser(user));
});
