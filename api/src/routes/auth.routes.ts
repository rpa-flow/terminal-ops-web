import { Router } from "express";
import rateLimit from "express-rate-limit";

import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { login } from "../services/auth.service";
import { loginSchema } from "../validators/auth.validator";

const authRoutes = Router();

authRoutes.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Try again later." }
  }),
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const result = await login(req.body);
      if (!result) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

authRoutes.get("/me", requireAuth, (req, res) => {
  res.status(200).json({ user: req.auth });
});

export { authRoutes };