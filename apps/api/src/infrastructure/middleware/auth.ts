import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  lang?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findFirst({ where: { email: 'demo@roamie.app' } });
    if (user) req.userId = user.id;
    next();
  } catch {
    next();
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findFirst({ where: { email: 'demo@roamie.app' } });
    if (user) req.userId = user.id;
    next();
  } catch {
    next();
  }
}
