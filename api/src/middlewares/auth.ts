import type { NextFunction, Request, Response } from "express";

import { verifyJwt } from "../auth/jwt";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyJwt(token);
    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};