import bcrypt from "bcryptjs";

import { signJwt } from "../auth/jwt";
import { findUserByEmail } from "../repositories/user.repository";
import type { LoginInput } from "../validators/auth.validator";

type LoginResult = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};

export const login = async (input: LoginInput): Promise<LoginResult | null> => {
  const user = await findUserByEmail(input.email);
  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  const token = signJwt({ sub: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      email: user.email
    }
  };
};