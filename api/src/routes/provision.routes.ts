import { Router } from "express";
import rateLimit from "express-rate-limit";

import { rateLimitKeyGenerator, rateLimitValidationConfig } from "../lib/rate-limit";
import { requireProvisionKey } from "../middlewares/provision-key";
import { validate } from "../middlewares/validate";
import { createUserService } from "../services/user.service";
import { createUserSchema } from "../validators/user.validator";

const provisionRoutes = Router();

provisionRoutes.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyGenerator: rateLimitKeyGenerator,
    validate: rateLimitValidationConfig,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Try again later." }
  })
);

provisionRoutes.post(
  "/users",
  requireProvisionKey,
  validate(createUserSchema),
  async (req, res) => {
    try {
      const user = await createUserService(req.body);
      res.status(201).json(user);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "DUPLICATE") {
        res.status(409).json({ message: "Email already in use" });
        return;
      }
      throw err;
    }
  }
);

export { provisionRoutes };
