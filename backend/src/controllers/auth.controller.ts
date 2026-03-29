import type { NextFunction, Response } from "express";
import type { AuthRequest } from "#src/types/auth.js";
import {
  signInSchema,
  signupSchema,
} from "#src/validations/auth.validation.js";
import { formValidationError } from "#src/utils/format.js";
import { cookies } from "#src/utils/cookies.js";
import logger from "#src/config/logger.js";
import { authenticateUser, createUser } from "#src/services/auth.service.js";
import { getDailyGenerationCount } from "#src/services/problem.service.js";
import { jwttoken } from "#src/utils/jwt.js";

export const signup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Valdiation failed",
        details: formValidationError(validationResult.error),
      });
    }
    const { name, email, password } = validationResult.data;
    const user = await createUser({ name, email, password });
    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
    });
    cookies.set(res, "token", token);
    logger.info(`User registered succesfully ${email}`);
    res.status(201).json({
      message: "User registered",
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
      },
    });
  } catch (e) {
    logger.error("SignUp error", e);
    if (
      e instanceof Error &&
      e.message === "User with this email already exists"
    ) {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(e);
  }
};

export const signin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Valdiation failed",
        details: formValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    const user = await authenticateUser(email, password);

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
    });

    cookies.set(res, "token", token);

    logger.info(`User logged in succesfully ${email}`);
    return res.status(200).json({
      message: "User logged in",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (e) {
    logger.error("SignIn error", e);
    if (e instanceof Error && e.message === "Invalid email or password") {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    next(e);
  }
};

export const signout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = cookies.get(req, "token");

    if (!token) {
      logger.info("Sign Out attempted without token");
    } else {
      logger.info("User signed out");
    }

    cookies.clear(res, "token");

    return res.status(200).json({ message: "User signed out" });
  } catch (e) {
    logger.error("Sign Out error", e);
    next(e);
  }
};

export const profile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usedToday = await getDailyGenerationCount(req.user!.id);
    res.json({
      user: {
        ...req.user,
        remainingToday: 10 - usedToday,
      },
    });
  } catch (e) {
    logger.error("Profile error", e);
    next(e);
  }
};
