import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(255),
  // bcrypt only uses the first 72 bytes, so cap it there.
  password: z.string().min(8, "Password must be at least 8 chars").max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
