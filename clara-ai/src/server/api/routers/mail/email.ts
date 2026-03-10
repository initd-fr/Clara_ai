import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { env } from "~/env";
import WelcomeEmail from "~/server/api/routers/mail/templates/WelcomeEmail";
import TicketCreatedEmail from "~/server/api/routers/mail/templates/TicketCreatedEmail";
import TicketAssignedEmail from "~/server/api/routers/mail/templates/TicketAssignedEmail";
import TicketUpdatedEmail from "~/server/api/routers/mail/templates/TicketUpdatedEmail";
import TicketResolvedEmail from "~/server/api/routers/mail/templates/TicketResolvedEmail";
import SubscriptionUpdateEmail from "~/server/api/routers/mail/templates/SubscriptionUpdateEmail";
import AccountDeletedConfirmationEmail from "~/server/api/routers/mail/templates/AccountDeletedConfirmationEmail";
import AccountDeletedBySupportEmail from "~/server/api/routers/mail/templates/AccountDeletedBySupportEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailFrom = () =>
  env.EMAIL_FROM ? `Clara AI <${env.EMAIL_FROM}>` : "Clara AI <noreply@example.com>";
const supportEmailFrom = () =>
  env.SUPPORT_EMAIL
    ? `Clara AI Support <${env.SUPPORT_EMAIL}>`
    : "Clara AI Support <support@example.com>";

// Fonction utilitaire pour charger une image locale et la convertir en base64
const loadImageAsAttachment = (imagePath: string, filename: string) => {
  try {
    const fullPath = path.resolve(process.cwd(), imagePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64Content = imageBuffer.toString("base64");

    // Déterminer le type MIME basé sur l'extension
    const extension = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    return {
      content: base64Content,
      filename,
      content_type: mimeTypes[extension] || "image/png",
    };
  } catch (error) {
    console.error(`Erreur lors du chargement de l'image ${imagePath}:`, error);
    return null;
  }
};

// Fonction générique pour envoyer des emails HTML avec support des images
export const sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    path?: string;
    content?: string;
    filename: string;
    content_type?: string;
  }>;
}) => {
  try {
    // Charger les images locales si nécessaire
    const processedAttachments = attachments
      .map((attachment) => {
        if (attachment.path) {
          return loadImageAsAttachment(attachment.path, attachment.filename);
        }
        return attachment;
      })
      .filter(
        (attachment): attachment is NonNullable<typeof attachment> =>
          attachment !== null,
      );

    const result = await resend.emails.send({
      from: emailFrom(),
      to,
      subject,
      html,
      attachments: processedAttachments,
    });
    if (process.env.NODE_ENV === "development") console.log("Email envoyé:", result);
    return result;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw new Error("Erreur lors de l'envoi de l'email");
  }
};

interface SendWelcomeEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface SendTicketCreatedEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  ticketId: number;
  title: string;
  description: string;
  page: string;
}

interface SendTicketAssignedEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  ticketId: number;
  title: string;
  staffName: string;
}

interface SendTicketUpdatedEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  ticketId: number;
  title: string;
  status: string;
  action: string;
  description: string;
  staffName: string;
}

interface SendTicketResolvedEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  ticketId: number;
  title: string;
  resolutionReason: string;
  staffName: string;
}

interface SendSubscriptionUpdateEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  subscriptionName: string;
  oldPrice?: number;
  newPrice?: number;
  changes: string[];
}

export const sendWelcomeEmail = async ({
  email,
  firstName,
  lastName,
  password,
}: SendWelcomeEmailProps) => {
  try {
    const result = await resend.emails.send({
      from: emailFrom(),
      to: email,
      subject: "Bienvenue sur Clara AI - Votre compte a été créé",
      react: WelcomeEmail({
        firstName,
        lastName,
        password,
        email,
      }),
    });
    if (process.env.NODE_ENV === "development")
      console.log("Résultat envoi email:", result);
    return result;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw new Error("Erreur lors de l'envoi de l'email");
  }
};

export const sendTicketCreatedEmail = async ({
  email,
  firstName,
  lastName,
  ticketId,
  title,
  description,
  page,
}: SendTicketCreatedEmailProps) => {
  try {
    const result = await resend.emails.send({
      from: supportEmailFrom(),
      to: email,
      subject: `Votre demande de support a été reçue - Ticket #${ticketId}`,
      react: TicketCreatedEmail({
        firstName,
        lastName,
        ticketId,
        title,
        description,
        page,
      }),
    });
    if (process.env.NODE_ENV === "development")
      console.log("Email de création de ticket envoyé:", result);
    return result;
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de création de ticket:",
      error,
    );
    throw new Error("Erreur lors de l'envoi de l'email de création de ticket");
  }
};

export const sendTicketAssignedEmail = async ({
  email,
  firstName,
  lastName,
  ticketId,
  title,
  staffName,
}: SendTicketAssignedEmailProps) => {
  try {
    const result = await resend.emails.send({
      from: supportEmailFrom(),
      to: email,
      subject: `Votre ticket #${ticketId} a été pris en charge`,
      react: TicketAssignedEmail({
        firstName,
        lastName,
        ticketId,
        title,
        staffName,
      }),
    });
    if (process.env.NODE_ENV === "development")
      console.log("Email d'assignation de ticket envoyé:", result);
    return result;
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email d'assignation de ticket:",
      error,
    );
    throw new Error(
      "Erreur lors de l'envoi de l'email d'assignation de ticket",
    );
  }
};

export const sendTicketUpdatedEmail = async ({
  email,
  firstName,
  lastName,
  ticketId,
  title,
  status,
  action,
  description,
  staffName,
}: SendTicketUpdatedEmailProps) => {
  try {
    const result = await resend.emails.send({
      from: supportEmailFrom(),
      to: email,
      subject: `Mise à jour de votre ticket #${ticketId}`,
      react: TicketUpdatedEmail({
        firstName,
        lastName,
        ticketId,
        title,
        status,
        action,
        description,
        staffName,
      }),
    });
    if (process.env.NODE_ENV === "development")
      console.log("Email de mise à jour de ticket envoyé:", result);
    return result;
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de mise à jour de ticket:",
      error,
    );
    throw new Error(
      "Erreur lors de l'envoi de l'email de mise à jour de ticket",
    );
  }
};

export const sendTicketResolvedEmail = async ({
  email,
  firstName,
  lastName,
  ticketId,
  title,
  resolutionReason,
  staffName,
}: SendTicketResolvedEmailProps) => {
  try {
    const result = await resend.emails.send({
      from: supportEmailFrom(),
      to: email,
      subject: `Votre ticket #${ticketId} a été résolu`,
      react: TicketResolvedEmail({
        firstName,
        lastName,
        ticketId,
        title,
        resolutionReason,
        staffName,
      }),
    });
    if (process.env.NODE_ENV === "development")
      console.log("Email de résolution de ticket envoyé:", result);
    return result;
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de résolution de ticket:",
      error,
    );
    throw new Error(
      "Erreur lors de l'envoi de l'email de résolution de ticket",
    );
  }
};

export const sendSubscriptionUpdateEmail = async ({
  email,
  firstName,
  lastName,
  subscriptionName,
  oldPrice,
  newPrice,
  changes,
}: SendSubscriptionUpdateEmailProps) => {
  try {
    const result = await resend.emails.send({
      from: emailFrom(),
      to: email,
      subject: `Votre abonnement ${subscriptionName} évolue !`,
      react: SubscriptionUpdateEmail({
        firstName,
        lastName,
        subscriptionName,
        oldPrice,
        newPrice,
        changes,
      }),
    });
    if (process.env.NODE_ENV === "development")
      console.log("Email de mise à jour d'abonnement envoyé:", result);
    return result;
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de mise à jour d'abonnement:",
      error,
    );
    throw new Error(
      "Erreur lors de l'envoi de l'email de mise à jour d'abonnement",
    );
  }
};

// === EMAILS DE SUPPRESSION DE COMPTE ===

interface SendAccountDeletedConfirmationEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  deletionDate: string;
}

export const sendAccountDeletedConfirmationEmail = async ({
  email,
  firstName,
  lastName,
  deletionDate,
}: SendAccountDeletedConfirmationEmailProps) => {
  try {
    const result = await resend.emails.send({
      from: emailFrom(),
      to: email,
      subject: "Confirmation de suppression de votre compte Clara",
      react: AccountDeletedConfirmationEmail({
        firstName,
        lastName,
        deletionDate,
      }),
    });
    if (process.env.NODE_ENV === "development")
      console.log("Email de confirmation de suppression envoyé:", result);
    return result;
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de confirmation de suppression:",
      error,
    );
    throw new Error(
      "Erreur lors de l'envoi de l'email de confirmation de suppression",
    );
  }
};

interface SendAccountDeletedBySupportEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  reason: string;
  deletionDate: string;
  supportEmail: string;
}

export const sendAccountDeletedBySupportEmail = async ({
  email,
  firstName,
  lastName,
  reason,
  deletionDate,
  supportEmail,
}: SendAccountDeletedBySupportEmailProps) => {
  try {
    const result = await resend.emails.send({
      from: supportEmailFrom(),
      to: email,
      subject: "Suppression de votre compte Clara",
      react: AccountDeletedBySupportEmail({
        firstName,
        lastName,
        reason,
        deletionDate,
        supportEmail,
      }),
    });
    if (process.env.NODE_ENV === "development")
      console.log("Email de suppression par support envoyé:", result);
    return result;
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de suppression par support:",
      error,
    );
    throw new Error(
      "Erreur lors de l'envoi de l'email de suppression par support",
    );
  }
};
