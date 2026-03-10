////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
type AccountRequestTemplateProps = {
  email: string;
  firstName: string;
  lastName: string;
};
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////STYLES///////////////////////////////////////////////////////////////////////////////////////
// Styles pour les templates d'email
const main = {
  backgroundColor: "#ffffff",
  color: "#24292e",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px 0 48px",
};

const title = {
  fontSize: "24px",
  lineHeight: 1.25,
  textAlign: "center" as const,
  marginBottom: "20px",
};

const section = {
  padding: "24px",
  border: "solid 1px #dedede",
  borderRadius: "5px",
  textAlign: "left" as const,
  marginTop: "20px",
};

const text = {
  margin: "0 0 10px 0",
  fontSize: "14px",
  color: "#333",
};

const footer = {
  color: "#6a737d",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "40px",
};
////////////////////////////////////////////////////////////////////////////////STYLES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export const ForgottenPasswordTemplate: React.FC<{ tempPassword: string }> = ({
  tempPassword,
}) => (
  <>
    <h1
      style={{
        color: "#1d1d1f",
        fontSize: "24px",
        fontWeight: "600",
        lineHeight: "40px",
        margin: "0 0 20px",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      Mot de passe temporaire
    </h1>
    <div>
      <p>Bonjour,</p>
      <p>
        Nous avons reçu une demande de réinitialisation de mot de passe pour
        votre compte. Si vous n&apos;avez pas effectué cette demande, veuillez
        ignorer cet email.
      </p>
      <p>
        Voici votre mot de passe temporaire : <strong>{tempPassword}</strong>
      </p>
      <p>
        Nous vous recommandons de le changer dès que possible après vous être
        connecté.
      </p>
      <p>
        Pour réinitialiser votre mot de passe connectez vous à votre compte avec
        votre mot de passe temporaire et rendez vous sur votre page paramètres
      </p>
      <p>
        Cordialement,
        <br />
        L&apos;équipe de Clara AI
      </p>
    </div>
  </>
);

export const AccountRequestTemplate: React.FC<
  Readonly<AccountRequestTemplateProps>
> = ({ email, firstName, lastName }: AccountRequestTemplateProps) => (
  <Html>
    <Head />
    <Preview>Nouvelle demande de création de compte</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={title}>Nouvelle demande de création de compte</Text>
        <Section style={section}>
          <Text style={text}>
            Une nouvelle demande de création de compte a été soumise avec les
            détails suivants :
          </Text>
          <Text style={text}>
            <strong>Prénom : </strong> {firstName}
          </Text>
          <Text style={text}>
            <strong>Nom : </strong> {lastName}
          </Text>
          <Text style={text}>
            <strong>Email : </strong> {email}
          </Text>
        </Section>
        <Text style={footer}> L&apos;équipe de Clara AI</Text>
      </Container>
    </Body>
  </Html>
);
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
