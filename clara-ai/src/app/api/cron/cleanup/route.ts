////////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { NextRequest, NextResponse } from "next/server";
import { CleanupService } from "~/server/services/cleanupService";
////////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////
export async function POST(request: NextRequest) {
  try {
    // Vérifier le token de sécurité
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      if (process.env.NODE_ENV === "development")
        console.warn("🚫 Tentative d'accès non autorisée à l'API de nettoyage");
      return NextResponse.json(
        { error: "Token d'authentification invalide" },
        { status: 401 },
      );
    }

    if (process.env.NODE_ENV === "development")
      console.log("🔄 Déclenchement manuel du nettoyage...");

    // Exécuter le nettoyage
    const result = await CleanupService.runFullCleanup();

    if (process.env.NODE_ENV === "development")
      console.log("✅ Nettoyage manuel terminé:", result);

    return NextResponse.json({
      success: true,
      message: "Nettoyage exécuté avec succès",
      result,
    });
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage manuel:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du nettoyage",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      "Route de nettoyage - Utilisez POST avec le token d'authentification",
  });
}

////////////////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////
