import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phone, description, accountCount } =
      await request.json();

    // Validation côté serveur
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !description ||
      !accountCount
    ) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 },
      );
    }

    // En local : pas d'envoi d'email, on accepte la demande
    if (process.env.NODE_ENV === "development") {
      console.log("[Contact] Demande reçue:", {
        firstName,
        lastName,
        email,
        phone,
        accountCount,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API contact:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
