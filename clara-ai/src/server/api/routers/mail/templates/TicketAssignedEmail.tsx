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

interface TicketAssignedEmailProps {
  firstName: string;
  lastName: string;
  ticketId: number;
  title: string;
  staffName: string;
}

export const TicketAssignedEmail: FC<TicketAssignedEmailProps> = ({
  firstName,
  lastName,
  ticketId,
  title,
  staffName,
}) => {
  const ticketIdString = String(ticketId);

  return (
    <Html>
      <Head />
      <Preview>
        Votre ticket #{ticketIdString} a été pris en charge par notre équipe
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentContainer}>
            <Heading style={h1}>
              Votre ticket est en cours de traitement
            </Heading>

            <Text style={text}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={text}>
              Bonne nouvelle ! Votre demande de support a été prise en charge
              par notre équipe.
            </Text>

            <Section style={ticketBox}>
              <Text style={ticketTitle}>
                <strong>{`Ticket #${ticketIdString}`}</strong>
              </Text>
              <Text style={ticketDetails}>
                <strong>Titre :</strong> {title}
              </Text>
              <Text style={ticketDetails}>
                <strong>Assigné à :</strong> {staffName}
              </Text>
              <Text style={ticketDetails}>
                <strong>Statut :</strong>{" "}
                <span style={statusInProgress}>En cours de traitement</span>
              </Text>
            </Section>

            <Text style={text}>
              Notre équipe travaille actuellement sur votre demande. Vous
              recevrez une mise à jour dès que nous aurons des informations à
              vous communiquer.
            </Text>

            <Text style={text}>
              Si vous avez des informations complémentaires à apporter,
              n&apos;hésitez pas à nous les transmettre.
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
            <Text style={footerText}>Merci de votre patience</Text>
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
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  border: "1px solid #0ea5e9",
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

const statusInProgress = {
  color: "#0ea5e9",
  fontWeight: "600",
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

export default TicketAssignedEmail;
