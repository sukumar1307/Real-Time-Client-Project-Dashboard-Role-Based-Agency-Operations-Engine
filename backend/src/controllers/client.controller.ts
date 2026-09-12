import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getClients = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, company, email } = req.body;

    const client = await prisma.client.create({
      data: { name, company, email },
    });

    return res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};
