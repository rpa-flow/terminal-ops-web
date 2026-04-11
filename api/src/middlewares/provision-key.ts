import type { NextFunction, Request, Response } from "express";

import { env } from "../config";

export const requireProvisionKey = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.header("x-provision-key");

  if (!key || key !== env.PROVISION_SECRET) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
};
