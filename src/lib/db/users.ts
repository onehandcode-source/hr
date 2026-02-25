import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function getUsers(includeInactive = false) {
  return prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
      ...(includeInactive ? {} : { isActive: true }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      position: true,
      hireDate: true,
      totalLeaves: true,
      usedLeaves: true,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      position: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  totalLeaves?: number;
  role?: Role;
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
      department: data.department,
      position: data.position,
      hireDate: data.hireDate ?? new Date(),
      totalLeaves: data.totalLeaves ?? 15,
      role: data.role ?? 'EMPLOYEE',
      isActive: true,
    },
  });
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    department?: string;
    position?: string;
    hireDate?: Date;
    totalLeaves?: number;
    isActive?: boolean;
  }
) {
  return prisma.user.update({
    where: { id },
    data,
  });
}
