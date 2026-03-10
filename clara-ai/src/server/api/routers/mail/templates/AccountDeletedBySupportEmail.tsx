import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
} from "@react-email/components";
import { type FC } from "react";

interface AccountDeletedBySupportEmailProps {
  firstName: string;
  lastName: string;
  reason: string;
  deletionDate: string;
  supportEmail: string;
}

export const AccountDeletedBySupportEmail: FC<
  AccountDeletedBySupportEmailProps
> = ({ firstName, lastName, reason, deletionDate, supportEmail }) => {
  return (
    <Html>
      <Head />
      <Preview>Suppression de votre compte Clara par notre équipe</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentContainer}>
            <Heading style={h1}>Compte supprimé par notre équipe</Heading>

            <Text style={text}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={text}>
              Nous vous informons que votre compte Clara a été supprimé par
              notre équipe le {deletionDate}.
            </Text>

            <Section style={warningBox}>
              <Text style={warningTitle}>
                <strong>Motif de la suppression :</strong>
              </Text>
              <Text style={warningText}>{reason}</Text>
            </Section>

            <Section style={infoBox}>
              <Text style={infoTitle}>
                <strong>Ce qui a été supprimé :</strong>
              </Text>
              <Text style={infoText}>
                • Votre compte utilisateur et toutes vos données personnelles
              </Text>
              <Text style={infoText}>
                • Tous vos modèles personnels et documents
              </Text>
              <Text style={infoText}>• Tous vos messages et conversations</Text>
              <Text style={infoText}>• Vos accès aux modèles store</Text>
              <Text style={infoText}>
                • Votre abonnement plateforme (résilié)
              </Text>
              <Text style={infoText}>
                • Tous vos abonnements aux modèles store (résiliés)
              </Text>
            </Section>

            <Text style={text}>
              <strong>Important :</strong> Toutes vos données ont été
              définitivement supprimées de nos serveurs et ne peuvent plus être
              récupérées.
            </Text>

            <Text style={text}>
              Si vous avez des questions concernant cette décision ou si vous
              souhaitez faire appel, vous pouvez nous contacter à l&apos;adresse
              suivante :
            </Text>

            <Text style={text}>
              <strong>Email de support :</strong> {supportEmail}
            </Text>

            <Text style={text}>
              Nous vous remercions d&apos;avoir utilisé Clara.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Cette décision a été prise conformément à nos conditions
              d&apos;utilisation.
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
  fontFamily: "Arial, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const contentContainer = {
  padding: "0 24px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const warningBox = {
  backgroundColor: "#fff3cd",
  border: "1px solid #ffeaa7",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const warningTitle = {
  color: "#856404",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 12px",
};

const warningText = {
  color: "#856404",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const infoBox = {
  backgroundColor: "#f8f9fa",
  border: "1px solid #e9ecef",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const infoTitle = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 12px",
};

const infoText = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 8px",
};

const hr = {
  borderColor: "#e9ecef",
  margin: "32px 0",
};

const footer = {
  padding: "0 24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#666",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0 0 8px",
};

export default AccountDeletedBySupportEmail;
