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

export function generateAccessToken(userId: string): string {
  const accessSecret = requireEnv("AUTH_SECRET");
  const accessExp = requireEnv("AUTH_SECRET_EXPIRATION");

  return jwt.sign({ userId }, accessSecret, {
    expiresIn: accessExp as any,
  });
}

export function generateRefreshToken(userId: string): string {
  const refreshSecret = requireEnv("AUTH_REFRESH_SECRET");
  const refreshExp = requireEnv("AUTH_REFRESH_EXPIRATION");

  return jwt.sign({ userId }, refreshSecret, {
    expiresIn: refreshExp as any,
  });
}

export function generateAuthTokens(userId: string): AuthTokens {
  const accessToken: string = generateAccessToken(userId);
  const refreshToken: string = generateRefreshToken(userId);

  return { accessToken, refreshToken };
}

// functions to attach access and refresh tokens to response cookies

export function setAccessToken(res: Response, accessToken: string): void {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true or false depending on .env
    maxAge: TIME.mToMs(15), // 15 minutes in milliseconds
    sameSite: "strict", // superficial CSRF protection, need csrf tokens
    path: "/api/"
  });
}

export function setRefreshToken(res: Response, refreshToken: string): void {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true or false depending on .env
    maxAge: TIME.dToMs(7),  // 7 days is milliseconds
    sameSite: "strict", // superficial CSRF protection, need csrf tokensa
    path: "/api/auth/refresh"
  });
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  setAccessToken(res, accessToken);
  setRefreshToken(res, refreshToken);
}

// function to clear all session cookies, used to successfully logout a user
export function clearSessionCookies(res: Response): void {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/"
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh"
  });
}



