import { Request, Response } from 'express';
import { prisma } from '@farmwise/db';

export const getPublicStats = async (_req: Request, res: Response) => {
  try {
    const [farmerCount, courseCount, instructorCount] = await Promise.all([
      prisma.user.count({ where: { role: 'FARMER' } }),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
    ]);
    res.json({ farmerCount, courseCount, instructorCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
