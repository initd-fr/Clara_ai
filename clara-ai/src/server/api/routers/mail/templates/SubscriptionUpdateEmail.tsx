import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
  Link,
  Section,
  Hr,
} from "@react-email/components";
import { type FC } from "react";

interface SubscriptionUpdateEmailProps {
  firstName: string;
  lastName: string;
  subscriptionName: string;
  oldPrice?: number;
  newPrice?: number;
  changes: string[];
}

export const SubscriptionUpdateEmail: FC<SubscriptionUpdateEmailProps> = ({
  firstName,
  lastName,
  subscriptionName,
  oldPrice,
  newPrice,
  changes,
}) => {
  const hasPriceChange =
    oldPrice !== undefined && newPrice !== undefined && oldPrice !== newPrice;
  const priceChangeText = hasPriceChange
    ? `de ${oldPrice}€ à ${newPrice}€ par mois`
    : "le prix reste inchangé";

  return (
    <Html>
      <Head />
      <Preview>Votre abonnement {subscriptionName} évolue !</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentContainer}>
            <Text style={title}>Votre abonnement évolue ! 🚀</Text>

            <Text style={text}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={text}>
              Nous avons le plaisir de vous informer que votre abonnement{" "}
              <strong>{subscriptionName}</strong> a été mis à jour pour vous
              offrir une meilleure expérience.
            </Text>

            {hasPriceChange && (
              <Section style={priceBox}>
                <Text style={priceTitle}>💳 Changement de prix</Text>
                <Text style={priceText}>
                  Le prix de votre abonnement passe {priceChangeText}.
                </Text>
                <Text style={priceNote}>
                  Ce changement s&apos;appliquera à votre prochaine facturation.
                </Text>
              </Section>
            )}

            {changes.length > 0 && (
              <Section style={changesBox}>
                <Text style={changesTitle}>✨ Nouvelles fonctionnalités</Text>
                <ul style={changesList}>
                  {changes.map((change, index) => (
                    <li key={index} style={changeItem}>
                      {change}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Text style={text}>
              Ces améliorations sont automatiquement appliquées à votre compte.
              Vous n&apos;avez rien à faire !
            </Text>

            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings`}
              style={button}
            >
              Voir mon abonnement
            </Link>

            <Text style={text}>
              Si vous avez des questions ou souhaitez modifier votre abonnement,
              n&apos;hésitez pas à nous contacter via notre support.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Merci de votre confiance et de votre fidélité !
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
  padding: "0 16px",
  "@media (min-width: 600px)": {
    padding: "0 40px",
  },
};

const title = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1f2937",
  textAlign: "center" as const,
  marginBottom: "24px",
  "@media (min-width: 600px)": {
    fontSize: "24px",
  },
};

const text = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#374151",
  marginBottom: "16px",
  "@media (min-width: 600px)": {
    fontSize: "16px",
    lineHeight: "24px",
  },
};

const priceBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "12px",
  margin: "16px 0",
  "@media (min-width: 600px)": {
    padding: "16px",
    margin: "20px 0",
  },
};

const priceTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#92400e",
  marginBottom: "8px",
  "@media (min-width: 600px)": {
    fontSize: "18px",
  },
};

const priceText = {
  fontSize: "14px",
  color: "#92400e",
  marginBottom: "8px",
  "@media (min-width: 600px)": {
    fontSize: "16px",
  },
};

const priceNote = {
  fontSize: "12px",
  color: "#92400e",
  fontStyle: "italic",
  "@media (min-width: 600px)": {
    fontSize: "14px",
  },
};

const changesBox = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #10b981",
  borderRadius: "8px",
  padding: "12px",
  margin: "16px 0",
  "@media (min-width: 600px)": {
    padding: "16px",
    margin: "20px 0",
  },
};

const changesTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#065f46",
  marginBottom: "12px",
  "@media (min-width: 600px)": {
    fontSize: "18px",
    marginBottom: "16px",
  },
};

const changesList = {
  margin: "0",
  padding: "0",
  listStyle: "none",
};

const changeItem = {
  fontSize: "14px",
  color: "#065f46",
  marginBottom: "6px",
  paddingLeft: "16px",
  position: "relative" as const,
  "@media (min-width: 600px)": {
    fontSize: "16px",
    paddingLeft: "20px",
    marginBottom: "8px",
  },
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  margin: "20px 0",
  width: "100%",
  boxSizing: "border-box" as const,
  "@media (min-width: 600px)": {
    fontSize: "16px",
    padding: "12px 24px",
    width: "auto",
    maxWidth: "200px",
    margin: "24px auto",
  },
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
  "@media (min-width: 600px)": {
    margin: "32px 0",
  },
};

const footer = {
  textAlign: "center" as const,
  padding: "0 16px",
  "@media (min-width: 600px)": {
    padding: "0 40px",
  },
};

const footerText = {
  fontSize: "12px",
  color: "#6b7280",
  marginBottom: "8px",
  "@media (min-width: 600px)": {
    fontSize: "14px",
  },
};

export default SubscriptionUpdateEmail;
