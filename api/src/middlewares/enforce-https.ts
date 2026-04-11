import type { NextFunction, Request, Response } from "express";

import { env } from "../config";

export const enforceHttps = (req: Request, res: Response, next: NextFunction): void => {
  if (env.NODE_ENV !== "production") {
    next();
    return;
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps = req.secure || forwardedProto === "https";

  if (!isHttps) {
    res.status(400).json({ message: "HTTPS is required" });
    return;
  }

  next();
};
