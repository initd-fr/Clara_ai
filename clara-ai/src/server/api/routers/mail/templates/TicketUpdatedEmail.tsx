import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Link,
  Section,
  Hr,
} from "@react-email/components";
import { type FC } from "react";

interface TicketUpdatedEmailProps {
  firstName: string;
  lastName: string;
  ticketId: number;
  title: string;
  status: string;
  action: string;
  description: string;
  staffName: string;
}

export const TicketUpdatedEmail: FC<TicketUpdatedEmailProps> = ({
  firstName,
  lastName,
  ticketId,
  title,
  status,
  action,
  description,
  staffName,
}) => {
  const ticketIdString = String(ticketId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "#0ea5e9";
      case "WAITING_FOR_USER":
        return "#f59e0b";
      case "RESOLVED":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "En cours de traitement";
      case "WAITING_FOR_USER":
        return "En attente de votre réponse";
      case "RESOLVED":
        return "Résolu";
      default:
        return status;
    }
  };

  return (
    <Html>
      <Head />
      <Preview>Mise à jour de votre ticket #{ticketIdString}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentContainer}>
            <Heading style={h1}>Mise à jour de votre ticket</Heading>

            <Text style={text}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={text}>
              Votre ticket de support a été mis à jour par notre équipe.
            </Text>

            <Section style={ticketBox}>
              <Text style={ticketTitle}>
                <strong>{`Ticket #${ticketIdString}`}</strong>
              </Text>
              <Text style={ticketDetails}>
                <strong>Titre :</strong> {title}
              </Text>
              <Text style={ticketDetails}>
                <strong>Action :</strong> {action}
              </Text>
              <Text style={ticketDetails}>
                <strong>Nouveau statut :</strong>{" "}
                <span
                  style={{ color: getStatusColor(status), fontWeight: "600" }}
                >
                  {getStatusLabel(status)}
                </span>
              </Text>
              <Text style={ticketDetails}>
                <strong>Mis à jour par :</strong> {staffName}
              </Text>
            </Section>

            <Section style={updateBox}>
              <Text style={updateTitle}>
                <strong>Détails de la mise à jour :</strong>
              </Text>
              <Text style={updateText}>{description}</Text>
            </Section>

            <Text style={text}>
              Si vous avez des questions ou des informations complémentaires à
              apporter, n&apos;hésitez pas à nous les transmettre.
            </Text>

            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/documentation`}
              style={button}
            >
              Voir mes tickets
            </Link>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Nous continuons à travailler sur votre demande
            </Text>
            <Text style={footerText}>
              © 2025 Clara AI. Tous droits réservés.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0",
  padding: "0",
  width: "100%",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
  width: "100%",
  boxSizing: "border-box" as const,
};

const contentContainer = {
  padding: "0 48px",
};

const h1 = {
  color: "#1d1d1f",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  textAlign: "center" as const,
  fontFamily: "Inter, sans-serif",
};

const text = {
  color: "#86868b",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
  fontFamily: "Inter, sans-serif",
};

const ticketBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  border: "1px solid #e2e8f0",
};

const ticketTitle = {
  color: "#0091ff",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 16px",
  fontFamily: "Inter, sans-serif",
};

const ticketDetails = {
  color: "#1d1d1f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
  fontFamily: "Inter, sans-serif",
};

const updateBox = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #e5e5e7",
};

const updateTitle = {
  color: "#1d1d1f",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 12px",
  fontFamily: "Inter, sans-serif",
};

const updateText = {
  color: "#1d1d1f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  fontFamily: "Inter, sans-serif",
};

const button = {
  background: "linear-gradient(to right, #0091ff, #00b8ff)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "16px",
  margin: "32px 0",
  fontFamily: "Inter, sans-serif",
  boxShadow: "0 2px 8px rgba(0, 145, 255, 0.2)",
};

const hr = {
  borderColor: "#e5e5e7",
  margin: "32px 0",
};

const footer = {
  padding: "0 48px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#86868b",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "8px 0",
  fontFamily: "Inter, sans-serif",
};

export default TicketUpdatedEmail;
