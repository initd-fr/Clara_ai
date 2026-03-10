import { settingsManager } from "./settingsManager";

export async function initializeSettings() {
  try {
    await settingsManager.initializeDefaultSettings();
    console.log("✅ Paramètres système initialisés avec succès");
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation des paramètres système:",
      error,
    );
  }
}
