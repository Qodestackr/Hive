import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from "@react-email/components"
import type { JSX } from "react"

interface UserInviteEmailProps {
  inviterName: string
  inviteeName: string
  organizationName: string
  role: string
  inviteUrl: string
  expiresIn?: string
}

export function UserInviteEmail({
  inviterName,
  inviteeName,
  organizationName,
  role,
  inviteUrl,
  expiresIn = "7 days",
}: UserInviteEmailProps): JSX.Element {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {organizationName} on Promco Platform</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src="https://promco.co/logo.png" width="170" height="50" alt="Promco Platform" style={logo} />
          <Heading style={h1}>You're Invited! 🎉</Heading>
          <Text style={text}>Hi {inviteeName},</Text>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join <strong>{organizationName}</strong> on Promco
            Platform as a <strong>{role}</strong>.
          </Text>

          <Section style={inviteBox}>
            <Text style={inviteTitle}>Organization: {organizationName}</Text>
            <Text style={inviteDetail}>Role: {role}</Text>
            <Text style={inviteDetail}>Invited by: {inviterName}</Text>
          </Section>

          <Text style={text}>
            Promco Platform helps teams manage their business operations, track inventory, monitor sales, and
            collaborate effectively. Join your team to get started!
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Section style={infoBox}>
            <Text style={infoText}>
              💡 This invitation will expire in {expiresIn}. If you don't have an Promco Platform account yet, one will
              be created for you when you accept this invitation.
            </Text>
          </Section>

          <Text style={text}>
            If you have any questions about this invitation or need help getting started, feel free to contact our
            support team.
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The Promco Platform Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
}

const logo = {
  margin: "0 auto 32px",
  display: "block",
}

const h1 = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 32px",
  padding: "0",
  textAlign: "center" as const,
}

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
  padding: "0 32px",
}

const inviteBox = {
  margin: "24px 32px",
  padding: "24px",
  backgroundColor: "#ecfdf5",
  borderRadius: "8px",
  border: "2px solid #10b981",
}

const inviteTitle = {
  color: "#065f46",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
}

const inviteDetail = {
  color: "#047857",
  fontSize: "15px",
  lineHeight: "20px",
  margin: "0 0 8px",
}

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#059669",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.3)",
}

const infoBox = {
  margin: "24px 32px",
  padding: "16px",
  backgroundColor: "#f0f9ff",
  borderRadius: "6px",
  border: "1px solid #0ea5e9",
}

const infoText = {
  color: "#0c4a6e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
}

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  marginTop: "32px",
  padding: "0 32px",
  textAlign: "center" as const,
}
