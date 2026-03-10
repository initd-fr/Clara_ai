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

interface AccountDeletedConfirmationEmailProps {
  firstName: string;
  lastName: string;
  deletionDate: string;
}

export const AccountDeletedConfirmationEmail: FC<
  AccountDeletedConfirmationEmailProps
> = ({ firstName, lastName, deletionDate }) => {
  return (
    <Html>
      <Head />
      <Preview>Confirmation de suppression de votre compte Clara</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentContainer}>
            <Heading style={h1}>Compte supprimé avec succès</Heading>

            <Text style={text}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={text}>
              Nous confirmons que votre compte Clara a été supprimé avec succès
              le {deletionDate}.
            </Text>

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
              Si vous souhaitez créer un nouveau compte à l&apos;avenir, vous
              pouvez vous inscrire à nouveau sur notre plateforme.
            </Text>

            <Text style={text}>
              Nous vous remercions d&apos;avoir utilisé Clara et espérons vous
              revoir bientôt.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Si vous n&apos;avez pas demandé la suppression de votre compte,
              veuillez nous contacter immédiatement.
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

export default AccountDeletedConfirmationEmail;
