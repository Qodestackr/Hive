import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type { JSX } from "react";

interface PasswordResetEmailProps {
	name: string;
	resetUrl: string;
}

export function PasswordResetEmail({
	name,
	resetUrl,
}: PasswordResetEmailProps): JSX.Element {
	return (
		<Html>
			<Head />
			<Preview>Reset your Promco Platform password</Preview>
			<Body style={main}>
				<Container style={container}>
					<Img
						src="https://promco.co/logo.png"
						width="170"
						height="50"
						alt="Promco Platform"
						style={logo}
					/>
					<Heading style={h1}>Reset Your Password</Heading>
					<Text style={text}>Hi {name},</Text>
					<Text style={text}>
						We received a request to reset your password for your Promco
						Platform account. Click the button below to create a new password:
					</Text>
					<Section style={btnContainer}>
						<Button style={button} href={resetUrl}>
							Reset Password
						</Button>
					</Section>
					<Section style={warningBox}>
						<Text style={warningText}>
							⚠️ This link will expire in 1 hour for security reasons. If you
							didn't request this password reset, you can safely ignore this
							email and your password will remain unchanged.
						</Text>
					</Section>
					<Text style={text}>
						For security reasons, this reset link can only be used once. If you
						need another reset link, please visit our login page and request a
						new one.
					</Text>
					<Text style={footer}>
						Best regards,
						<br />
						The Promco Platform Team
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#f8fafc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
	margin: "0 auto",
	padding: "20px 0 48px",
	maxWidth: "560px",
	backgroundColor: "#ffffff",
	borderRadius: "8px",
	boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const logo = {
	margin: "0 auto 32px",
	display: "block",
};

const h1 = {
	color: "#1f2937",
	fontSize: "28px",
	fontWeight: "bold",
	margin: "0 0 32px",
	padding: "0",
	textAlign: "center" as const,
};

const text = {
	color: "#374151",
	fontSize: "16px",
	lineHeight: "26px",
	margin: "0 0 16px",
	padding: "0 32px",
};

const btnContainer = {
	textAlign: "center" as const,
	margin: "32px 0",
};

const button = {
	backgroundColor: "#0d9488",
	borderRadius: "8px",
	color: "#ffffff",
	fontSize: "16px",
	fontWeight: "600",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	padding: "14px 32px",
	boxShadow: "0 4px 6px -1px rgba(13, 148, 136, 0.3)",
};

const warningBox = {
	margin: "24px 32px",
	padding: "16px",
	backgroundColor: "#fef3c7",
	borderRadius: "6px",
	border: "1px solid #f59e0b",
};

const warningText = {
	color: "#92400e",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "0",
};

const footer = {
	color: "#6b7280",
	fontSize: "14px",
	lineHeight: "24px",
	marginTop: "32px",
	padding: "0 32px",
	textAlign: "center" as const,
};
