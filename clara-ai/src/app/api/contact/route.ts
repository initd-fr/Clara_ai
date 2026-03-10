import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { sendEmail } from "~/server/api/routers/mail/email";

export async function POST(request: NextRequest) {
  try {
    const contactTo = env.CONTACT_EMAIL;
    if (!contactTo) {
      return NextResponse.json(
        { error: "Contact non configuré (CONTACT_EMAIL manquant)" },
        { status: 503 },
      );
    }

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

    // Envoyer l'email
    await sendEmail({
      to: contactTo,
      subject: `Demande de contact - ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0091ff 0%, #00b8ff 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
              Nouvelle demande de contact
            </h1>
            <p style="color: #ffffff; margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">
              Clara AI - Besoins spécifiques
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <!-- Informations du contact -->
            <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #0091ff;">
              <h3 style="color: #0091ff; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                Informations du contact
              </h3>
              <div style="display: grid; gap: 8px;">
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong style="color: #111827;">Nom :</strong> ${firstName} ${lastName}
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong style="color: #111827;">Email :</strong> ${email}
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong style="color: #111827;">Téléphone :</strong> ${phone}
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong style="color: #111827;">Nombre de comptes demandés :</strong> ${accountCount}
                </p>
              </div>
            </div>
            
            <!-- Description des besoins -->
            <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #0091ff; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                Description des besoins
              </h3>
              <div style="background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap; font-size: 14px;">${description}</p>
              </div>
            </div>
            
            <!-- Action requise -->
            <div style="background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%); padding: 20px; border-radius: 8px; border: 1px solid #81d4fa;">
              <p style="margin: 0; color: #0277bd; font-size: 14px; font-weight: 500;">
                <strong>Action requise :</strong> Contacter le client pour discuter de ses besoins spécifiques et proposer une solution adaptée.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Email automatique envoyé par Clara AI
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API contact:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
