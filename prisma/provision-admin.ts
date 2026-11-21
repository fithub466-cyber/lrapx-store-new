import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const db = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const username = 'admin';
  const email = 'admin@lrapx.store';
  const existing = await db.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role !== 'ADMIN') {
      throw new Error('Reserved admin identity already belongs to a non-admin account; refusing to promote it.');
    }
    console.log('Admin account already exists; password unchanged.');
    return;
  }

  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password || password.length < 16) {
    console.log('Initial admin not created: set ADMIN_INITIAL_PASSWORD (16+ characters) in Vercel to provision it.');
    return;
  }

  await db.user.create({
    data: {
      username,
      email,
      passwordHash: hashPassword(password),
      role: 'ADMIN',
      status: 'ACTIVE',
      wallet: { create: { balance: 0 } },
    },
  });
  console.log('Initial admin account created.');
}

main()
  .catch((error) => {
    console.error('Admin provisioning failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
