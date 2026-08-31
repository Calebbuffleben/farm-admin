/**
 * Interactive CLI to create or update a platform admin in Postgres (Prisma).
 *
 * Usage: pnpm admin:create
 */
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as argon2 from "argon2";
import { AdminRole, PrismaClient } from "../src/generated/prisma";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

const prisma = new PrismaClient();

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function main() {
  console.log("\n=== Meet Admin — cadastro de operador ===\n");
  console.log(
    "Este comando grava e-mail e senha na tabela AdminUser (Prisma).\n",
  );

  const rl = readline.createInterface({ input, output });

  try {
    const emailRaw = await rl.question("E-mail: ");
    const email = emailRaw.trim().toLowerCase();
    if (!isValidEmail(email)) {
      throw new Error("E-mail inválido.");
    }

    const password = await rl.question(
      "Senha (mín. 12 caracteres, visível ao digitar): ",
    );
    if (password.length < 12) {
      throw new Error("A senha deve ter pelo menos 12 caracteres.");
    }

    const confirm = await rl.question("Confirmar senha: ");
    if (password !== confirm) {
      throw new Error("As senhas não coincidem.");
    }

    const nameRaw = await rl.question("Nome (opcional): ");
    const name = nameRaw.trim() || null;

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    let role: AdminRole = AdminRole.ADMIN;

    if (existing) {
      const overwrite = await rl.question(
        `Já existe um admin com ${email}. Atualizar senha? (s/N): `,
      );
      if (!/^s(im)?$/i.test(overwrite.trim())) {
        console.log("Cancelado.");
        return;
      }
      role = existing.role;
    } else {
      const count = await prisma.adminUser.count();
      if (count === 0) {
        role = AdminRole.SUPER_ADMIN;
        console.log("Primeiro usuário → papel SUPER_ADMIN.");
      } else {
        const roleAnswer = await rl.question(
          "Papel (1=ADMIN, 2=SUPER_ADMIN) [1]: ",
        );
        role =
          roleAnswer.trim() === "2" ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN;
      }
    }

    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

    if (existing) {
      await prisma.adminUser.update({
        where: { email },
        data: { passwordHash, name: name ?? existing.name, active: true },
      });
      console.log(`\n✓ Senha atualizada para ${email} (${existing.role}).`);
    } else {
      const user = await prisma.adminUser.create({
        data: { email, passwordHash, name, role, active: true },
      });
      console.log(`\n✓ Admin criado: ${user.email} (${user.role}).`);
    }

    console.log("\nFaça login em http://localhost:3220/login\n");
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("\nErro:", err instanceof Error ? err.message : err);
  process.exit(1);
});
