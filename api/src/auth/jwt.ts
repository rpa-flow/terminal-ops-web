import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../config";

type JwtPayload = {
  sub: string;
  email: string;
};

export const signJwt = (payload: JwtPayload): string => {
  const options: SignOptions = { issuer: "terminal-ops-api" };

  if (env.JWT_EXPIRES_IN) {
    options.expiresIn = env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>;
  }

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyJwt = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: "terminal-ops-api"
  });

  return decoded as JwtPayload;
};