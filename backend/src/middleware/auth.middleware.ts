import type { Response, NextFunction } from "express";
import { jwttoken } from "#utils/jwt.js";
import { cookies } from "#utils/cookies.js";
import type { AuthRequest } from "#types/auth.js";
import logger from "#config/logger.js";
import { prisma } from "#src/lib/prisma.js";

/**
 * Authentication middleware to verify JWT from cookies or Authorization header.
 * Attaches the database user to req.user if verification is successful.
 */
export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Extract token (Priority: Cookie > Authorization Header)
    let token = cookies.get(req, "token");

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        message: "No auth token provided",
        error: "UNAUTHORIZED",
      });
      return;
    }

    // 2. Verify token payload
    const decoded = jwttoken.verify(token) as { id: string } | null;

    if (!decoded || !decoded.id) {
      res.status(401).json({
        message: "Invalid or expired auth token",
        error: "INVALID_TOKEN",
      });
      return;
    }

    // 3. Retrieve user from data-store (and exclude password)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "Associated user no longer exists",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    // 4. Attach user data to the request object
    req.user = user as any;
    next();
  } catch (error) {
    logger.error("Authentication error:", { error });
    res.status(401).json({
      message: "Authentication failed",
      error: "AUTH_FAILED",
    });
  }
};
