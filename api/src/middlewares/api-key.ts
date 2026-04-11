import type { NextFunction, Request, Response } from "express";

import { env } from "../config";

export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== env.INGEST_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
};