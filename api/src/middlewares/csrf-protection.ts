import type { NextFunction, Request, Response } from "express";

import { env } from "../config";

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
const protectedMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  if (!protectedMethods.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin && !allowedOrigins.includes(origin)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  if (referer) {
    const isTrusted = allowedOrigins.some((allowedOrigin) => referer.startsWith(allowedOrigin));
    if (!isTrusted) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
  }

  next();
};