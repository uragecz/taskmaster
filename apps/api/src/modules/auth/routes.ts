import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { login, logout, me, register } from "./controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export { router as authRouter };
