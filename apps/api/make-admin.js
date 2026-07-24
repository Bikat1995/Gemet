const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.updateMany({ data: { isAdmin: true } }).then(res => console.log('Updated users:', res.count)).catch(console.error).finally(() => prisma.$disconnect());
