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
