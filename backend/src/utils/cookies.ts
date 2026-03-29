import type { Response, Request, CookieOptions } from 'express';

export const cookies = {
  getOptions: (): CookieOptions => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 //  1 week
  }),

  set: (
    res: Response,
    name: string,
    value: string,
    options: CookieOptions = {}
  ) => {
    res.cookie(name, value, { ...cookies.getOptions(), ...options });
  },

  clear: (res: Response, name: string, options: CookieOptions = {}) => {
    const clearOptions = cookies.getOptions();
    delete clearOptions.maxAge;
    res.clearCookie(name, { ...clearOptions, ...options });
  },

  get: (req: Request, name: string): string | undefined => {
    return req.cookies?.[name];
  },
};