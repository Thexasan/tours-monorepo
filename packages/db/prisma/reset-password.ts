// Утилита: сменить пароль пользователю по email.
// Запуск:  npx tsx prisma/reset-password.ts <email> <new-password>
// Пример:  npx tsx prisma/reset-password.ts bob@tours.local partner123

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const [, , emailArg, password] = process.argv;
  if (!emailArg || !password) {
    console.error("Использование: npx tsx prisma/reset-password.ts <email> <new-password>");
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  const passwordHash = bcrypt.hashSync(password, 10);

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { passwordHash, isActive: true },
      select: { id: true, email: true, role: true, isActive: true },
    });
    console.log("✅ Пароль обновлён:");
    console.log(`   id:    ${user.id}`);
    console.log(`   email: ${user.email}`);
    console.log(`   role:  ${user.role}`);
    console.log(`   active: ${user.isActive}`);
    console.log("");
    console.log(`Теперь можно зайти: ${user.email} / ${password}`);
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") {
      console.error(`❌ Пользователь с email ${email} не найден.`);
    } else {
      console.error(e);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
