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

interface TicketCreatedEmailProps {
  firstName: string;
  lastName: string;
  ticketId: number;
  title: string;
  description: string;
  page: string;
}

export const TicketCreatedEmail: FC<TicketCreatedEmailProps> = ({
  firstName,
  lastName,
  ticketId,
  title,
  description,
  page,
}) => {
  const ticketIdString = String(ticketId);

  return (
    <Html>
      <Head />
      <Preview>
        Votre demande de support a été reçue - Ticket #{ticketIdString}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentContainer}>
            <Heading style={h1}>Demande de support reçue</Heading>

            <Text style={text}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={text}>
              Nous avons bien reçu votre demande de support. Notre équipe va
              l&apos;examiner et vous répondre dans les plus brefs délais.
            </Text>

            <Section style={ticketBox}>
              <Text style={ticketTitle}>
                <strong>{`Ticket #${ticketIdString}`}</strong>
              </Text>
              <Text style={ticketDetails}>
                <strong>Titre :</strong> {title}
              </Text>
              <Text style={ticketDetails}>
                <strong>Page concernée :</strong> {page}
              </Text>
              <Text style={ticketDetails}>
                <strong>Description :</strong>
              </Text>
              <Text style={ticketDescription}>{description}</Text>
            </Section>

            <Text style={text}>
              Vous recevrez une notification par email dès qu&apos;un membre de
              notre équipe prendra en charge votre demande.
            </Text>

            <Text style={text}>
              En attendant, vous pouvez consulter l&apos;état de votre ticket
              depuis votre espace personnel.
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
            <Text style={footerText}>Merci de votre confiance en Clara AI</Text>
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
  backgroundColor: "#f5f5f7",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  border: "1px solid #e5e5e7",
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

const ticketDescription = {
  color: "#1d1d1f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0 0 0",
  fontFamily: "Inter, sans-serif",
  backgroundColor: "#ffffff",
  padding: "12px",
  borderRadius: "4px",
  border: "1px solid #e5e5e7",
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

export default TicketCreatedEmail;
