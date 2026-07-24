import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.user.updateMany({ data: { isAdmin: true } });
console.log('Updated users');
await prisma.$disconnect();
