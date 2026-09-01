import { AdminRole, PrismaClient } from "../src/generated/prisma";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      "Skip seed: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create the first admin.",
    );
    return;
  }
  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Skip seed: ${email} already exists.`);
    return;
  }

  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
  const user = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      name: "Platform Admin",
      role: AdminRole.SUPER_ADMIN,
    },
  });
  console.log(`Created SUPER_ADMIN: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
