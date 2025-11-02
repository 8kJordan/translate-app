import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthedRequest extends Request {
  userId?: string;
}

// middleware that verifies authed cookies
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {

    const token = (req as any).cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ status: "error", errType: "UnauthorizedError" });
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return res.status(500).json({ status: "error", errType: "ServerError", desc: "Missing AUTH_SECRET" });
    }

    const payload = jwt.verify(token, secret) as { userId?: string }; // getting useId from jwt payload
    if (!payload?.userId) {
      return res.status(401).json({ status: "error", errType: "UnauthorizedError" });
    }

    req.userId = payload.userId;
    return next();

  } catch (err) {
    return res.status(401).json({ status: "error", errType: "UnauthorizedError" });
  }
}

