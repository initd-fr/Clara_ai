import bcrypt from "bcrypt";

// Récupérer le mot de passe depuis les arguments CLI
const args = process.argv.slice(2);
const password = args[0];

if (!password) {
  console.error("❌ Erreur : Veuillez fournir un mot de passe en argument !");
  console.log("Usage : node scripts/hashPassword.js <mot_de_passe>");
  process.exit(1);
}

(async () => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Mot de passe hashé :", hashedPassword);
  } catch (error) {
    console.error("❌ Erreur lors du hash du mot de passe :", error);
  }
})();
