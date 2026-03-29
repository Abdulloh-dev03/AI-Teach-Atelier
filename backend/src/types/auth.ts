import type { Request } from "express";

export interface AuthRequest extends Request {
  user?: any;
}

export interface CreateUserDTO {
    name:string;
    email:string;
    password:string;
}
