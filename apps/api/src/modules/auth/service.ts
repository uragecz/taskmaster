import type { EntityManager } from "@mikro-orm/postgresql";
import bcrypt from "bcryptjs";
import { User } from "../../entities/User";
import { HttpError } from "../../middleware/errorHandler";
import type { LoginInput, RegisterInput } from "./validation";

const BCRYPT_ROUNDS = 10;

export class AuthService {
  constructor(private readonly em: EntityManager) {}

  async register(input: RegisterInput): Promise<User> {
    const existing = await this.em.findOne(User, { email: input.email });
    if (existing) {
      throw new HttpError(409, "Email already registered");
    }

    const user = this.em.create(User, {
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
    });
    await this.em.persist(user).flush();
    return user;
  }

  async login(input: LoginInput): Promise<User> {
    const user = await this.em.findOne(User, { email: input.email });
    // Same error whether the email or the password is wrong (no user enumeration).
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }
    return user;
  }
}
