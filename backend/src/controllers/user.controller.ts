import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roleQuery = req.query.role as Role | undefined;

    const users = await prisma.user.findMany({
      where: roleQuery ? { role: roleQuery } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
