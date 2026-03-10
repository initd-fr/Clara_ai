import { NextApiRequest, NextApiResponse } from "next";
import { CleanupService } from "~/server/services/cleanupService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Vérifier que c'est bien un appel POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vérifier un token secret pour sécuriser l'appel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await CleanupService.runFullCleanup();

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage automatique:", error);

    return res.status(500).json({
      error: "Erreur lors du nettoyage automatique",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
