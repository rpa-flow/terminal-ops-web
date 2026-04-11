import type { NextFunction, Request, Response } from "express";

import { env } from "../config";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(500).json({
    message: env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
};