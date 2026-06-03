import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export interface JwtPayload {
  sub: number;
}

export function signToken(userId: number): string {
  // `sub` is a string per the JWT spec; we convert back on verify.
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || decoded.sub === undefined) {
    throw new Error("Invalid token payload");
  }
  return { sub: Number(decoded.sub) };
}
