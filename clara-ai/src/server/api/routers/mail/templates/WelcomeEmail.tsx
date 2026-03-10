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
  Heading,
} from "@react-email/components";
import { type FC } from "react";

interface WelcomeEmailProps {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
}

export const WelcomeEmail: FC<WelcomeEmailProps> = ({
  firstName,
  lastName,
  password,
  email,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Bienvenue sur Clara AI - Votre compte a été créé</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentContainer}>
            <Heading style={h1}>Bienvenue sur Clara AI</Heading>

            <Text style={text}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={text}>
              Votre compte a été créé avec succès. Voici vos identifiants de
              connexion :
            </Text>

            <Section style={credentialsBox}>
              <Text style={credentialsText}>
                <strong>Email :</strong> {email}
              </Text>
              <Text style={credentialsText}>
                <strong>Mot de passe temporaire :</strong> {password}
              </Text>
            </Section>

            <Text style={text}>
              Pour des raisons de sécurité, nous vous recommandons de changer
              votre mot de passe dès votre première connexion.
            </Text>

            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth`}
              style={button}
            >
              Se connecter
            </Link>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Si vous n&apos;avez pas demandé la création de ce compte, veuillez
              ignorer cet email.
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

const credentialsBox = {
  backgroundColor: "#f5f5f7",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  border: "1px solid #e5e5e7",
};

const credentialsText = {
  color: "#1d1d1f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
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

export default WelcomeEmail;
