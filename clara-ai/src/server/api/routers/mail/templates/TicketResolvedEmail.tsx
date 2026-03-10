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

interface TicketResolvedEmailProps {
  firstName: string;
  lastName: string;
  ticketId: number;
  title: string;
  resolutionReason: string;
  staffName: string;
}

export const TicketResolvedEmail: FC<TicketResolvedEmailProps> = ({
  firstName,
  lastName,
  ticketId,
  title,
  resolutionReason,
  staffName,
}) => {
  const ticketIdString = String(ticketId);

  return (
    <Html>
      <Head />
      <Preview>Votre ticket #{ticketIdString} a été résolu</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentContainer}>
            <Heading style={h1}>Votre ticket a été résolu</Heading>

            <Text style={text}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={text}>
              Excellente nouvelle ! Votre demande de support a été résolue par
              notre équipe.
            </Text>

            <Section style={ticketBox}>
              <Text style={ticketTitle}>
                <strong>{`Ticket #${ticketIdString}`}</strong>
              </Text>
              <Text style={ticketDetails}>
                <strong>Titre :</strong> {title}
              </Text>
              <Text style={ticketDetails}>
                <strong>Résolu par :</strong> {staffName}
              </Text>
              <Text style={ticketDetails}>
                <strong>Statut :</strong>{" "}
                <span style={statusResolved}>Résolu</span>
              </Text>
            </Section>

            <Section style={resolutionBox}>
              <Text style={resolutionTitle}>
                <strong>Solution apportée :</strong>
              </Text>
              <Text style={resolutionText}>{resolutionReason}</Text>
            </Section>

            <Text style={text}>
              Si vous avez d&apos;autres questions ou si cette solution ne
              répond pas complètement à votre problème, n&apos;hésitez pas à
              créer un nouveau ticket de support.
            </Text>

            <Text style={text}>Merci de votre confiance en Clara AI !</Text>

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
              Nous espérons que cette solution vous convient
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
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  border: "1px solid #22c55e",
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

const statusResolved = {
  color: "#22c55e",
  fontWeight: "600",
};

const resolutionBox = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #e5e5e7",
};

const resolutionTitle = {
  color: "#1d1d1f",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 12px",
  fontFamily: "Inter, sans-serif",
};

const resolutionText = {
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

export default TicketResolvedEmail;
