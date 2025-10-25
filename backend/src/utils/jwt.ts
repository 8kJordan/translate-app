import jwt from "jsonwebtoken";
import { Response } from "express";
import { TIME } from "@utils/constants"


export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// utility functions to generate JWT access + refresh tokens
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function generateAuthTokens(userId: string): AuthTokens {
  const accessSecret = requireEnv("AUTH_SECRET");
  const accessExp = requireEnv("AUTH_SECRET_EXPIRATION");
  const refreshSecret = requireEnv("AUTH_REFRESH_SECRET");
  const refreshExp = requireEnv("AUTH_REFRESH_EXPIRATION");

  const accessToken = jwt.sign({ userId }, accessSecret, {
    expiresIn: accessExp as any,
  });

  const refreshToken = jwt.sign({ userId }, refreshSecret, {
    expiresIn: refreshExp as any,
  });

  return { accessToken, refreshToken };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true or false depending on .env
    maxAge: TIME.mToMs(15), // 15 minutes in milliseconds
    sameSite: "strict", // superficial CSRF protection, need csrf tokens
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true or false depending on .env
    maxAge: TIME.hToMs(24),  // 24 hours is milliseconds
    sameSite: "strict", // superficial CSRF protection, need csrf tokens
  });
}

