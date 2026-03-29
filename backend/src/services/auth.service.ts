import logger from "#src/config/logger.js";
import { prisma } from "#src/lib/prisma.js";
import type { CreateUserDTO } from "#src/types/auth.js";
import bcrypt from "bcrypt";

export const hashPassword = async (password: string) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    logger.error(`Error hashing password ${e}`);
    throw new Error("Invalid hashing");
  }
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (e) {
    logger.error(`Error comparing password ${e}`);
    throw new Error("Invalid password comparison");
  }
};

export const createUser = async (data: CreateUserDTO) => {
  try {
    const { name, email, password } = data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await hashPassword(password);
    const newuser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    logger.info(`User ${newuser?.email} created successfully`);
    return newuser;
  } catch (e) {
    logger.error(`Error creating user ${e}`);
    throw e;
  }
};

export const authenticateUser = async (email: string, password: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid email or password");
    }
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    logger.info(`User ${user.email} authenticated successfully`);
    return user;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Invalid email or password'
    ) {
      logger.warn(`Authentication failed for email ${email}: ${error.message}`);
      throw error;
    }

    logger.error('Error authenticating user', error);
    throw error;
  }
};
