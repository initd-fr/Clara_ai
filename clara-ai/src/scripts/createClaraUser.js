/**
 * Crée l'utilisateur par défaut à partir des variables d'environnement :
 * CLARA_DEFAULT_EMAIL, CLARA_DEFAULT_PASSWORD, CLARA_DEFAULT_FIRST_NAME, CLARA_DEFAULT_LAST_NAME
 * Idempotent : ne fait rien si l'utilisateur existe déjà.
 * Usage : node src/scripts/createClaraUser.js
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = process.env.CLARA_DEFAULT_EMAIL;
const password = process.env.CLARA_DEFAULT_PASSWORD;
const firstName = process.env.CLARA_DEFAULT_FIRST_NAME;
const lastName = process.env.CLARA_DEFAULT_LAST_NAME;

const db = new PrismaClient();

async function main() {
  if (!email?.trim() || !password?.trim()) {
    console.error(
      "❌ CLARA_DEFAULT_EMAIL et CLARA_DEFAULT_PASSWORD doivent être renseignés dans le .env",
    );
    process.exit(1);
  }
  const existing = await db.user.findUnique({
    where: { email: email.trim() },
  });
  if (existing) {
    console.log("✅ Utilisateur par défaut existe déjà (email:", email + ")");
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      email: email.trim(),
      firstName: (firstName ?? "Clara").trim(),
      lastName: (lastName ?? "AI").trim(),
      password: hashedPassword,
      accountType: "personal",
    },
  });
  console.log(
    "✅ Utilisateur par défaut créé :",
    email,
    "| prénom:",
    firstName,
    "| nom:",
    lastName,
  );
}

main()
  .catch((e) => {
    console.error("❌ Erreur création utilisateur Clara :", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
