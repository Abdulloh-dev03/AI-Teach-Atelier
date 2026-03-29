import logger from '#src/config/logger.js';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

const jwtsecret = process.env.JWT_SECRET;
const jwtexpires = process.env.JWT_EXPIRES_IN;

export const jwttoken = {
  sign: (payload: string | object | Buffer) => {
    if (!jwtsecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    try {
      return jwt.sign(payload, jwtsecret, {
        expiresIn: jwtexpires as SignOptions['expiresIn'],
      });
    } catch (error) {
      logger.error('Failed to sign token', error);
      throw new Error('Failed to sign token');
    }
  },
  verify: (token: string) => {
    if (!jwtsecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    try {
      return jwt.verify(token, jwtsecret);
    } catch (error) {
      logger.error('Failed to verify token', error);
      throw new Error('Failed to authenticate token');
    }
  },
};