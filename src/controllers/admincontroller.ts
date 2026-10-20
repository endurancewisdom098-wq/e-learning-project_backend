// @ts-nocheck
import { Request, Response } from 'express';
import { hashPassword } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const getAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, password } = req.body;

    const existingAdmin = await prisma.user.findUnique({ where: { email } });
    if (existingAdmin) {
      res.status(400).json({ error: 'Admin with this email already exists.' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await prisma.user.create({
      data: {
        email,
        name: name || email,
        role: 'ADMIN',
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await prisma.user.deleteMany({
      where: {
        id: id,
        role: 'ADMIN',
      },
    });
    if (deleted.count === 0) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
