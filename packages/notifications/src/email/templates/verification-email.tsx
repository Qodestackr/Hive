import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface VerificationEmailProps {
	verificationUrl: string;
	token?: string;
	userName?: string;
}

export const VerificationEmail = ({
	verificationUrl,
	token,
	userName = "there",
}: VerificationEmailProps) => (
	<Html>
		<Head />
		<Preview>
			Verify your email address to complete your Promco account setup
		</Preview>
		<Body style={main}>
			<Container style={container}>
				<Section style={logoContainer}>
					<Img
						src="https://promco.co/logo.png"
						width="120"
						height="40"
						alt="Promco"
						style={logo}
					/>
				</Section>

				<Section style={heroSection}>
					<Heading style={h1}>Verify Your Email Address</Heading>
					<Text style={heroText}>
						Hi {userName}! We're excited to have you join Promco. To complete
						your account setup and ensure the security of your account, please
						verify your email address.
					</Text>
				</Section>

				<Section style={buttonContainer}>
					<Button style={button} href={verificationUrl}>
						Verify Email Address
					</Button>
				</Section>

				<Section style={infoSection}>
					<Text style={infoText}>
						This verification link will expire in 24 hours for security reasons.
						If you didn't create an account with Promco, you can safely ignore
						this email.
					</Text>

					<Text style={infoText}>
						If the button above doesn't work, you can also copy and paste this
						link into your browser:
					</Text>

					<Text style={linkText}>
						<Link href={verificationUrl} style={link}>
							{verificationUrl}
						</Link>
					</Text>
				</Section>

				<Section style={footerSection}>
					<Text style={footerText}>
						Need help? Contact our support team at{" "}
						<Link href="mailto:support@promco.co" style={supportLink}>
							support@promco.co
						</Link>
					</Text>

					<Text style={footerText}>© 2024 Promco. All rights reserved.</Text>
				</Section>
			</Container>
		</Body>
	</Html>
);

export default VerificationEmail;

const main = {
	backgroundColor: "#f8fafc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
	margin: "0 auto",
	padding: "20px 0 48px",
	maxWidth: "580px",
};

const logoContainer = {
	padding: "32px 20px",
	textAlign: "center" as const,
};

const logo = {
	margin: "0 auto",
};

const heroSection = {
	padding: "0 20px 32px",
	textAlign: "center" as const,
};

const h1 = {
	color: "#0f172a",
	fontSize: "32px",
	fontWeight: "700",
	margin: "0 0 24px",
	lineHeight: "1.25",
};

const heroText = {
	color: "#475569",
	fontSize: "16px",
	lineHeight: "1.6",
	margin: "0 0 24px",
};

const buttonContainer = {
	padding: "0 20px 32px",
	textAlign: "center" as const,
};

const button = {
	backgroundColor: "#10b981",
	borderRadius: "8px",
	color: "#ffffff",
	fontSize: "16px",
	fontWeight: "600",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	padding: "14px 32px",
	border: "none",
	cursor: "pointer",
};

const infoSection = {
	padding: "0 20px 32px",
	borderTop: "1px solid #e2e8f0",
	paddingTop: "32px",
};

const infoText = {
	color: "#64748b",
	fontSize: "14px",
	lineHeight: "1.6",
	margin: "0 0 16px",
};

const linkText = {
	margin: "16px 0",
	padding: "12px",
	backgroundColor: "#f1f5f9",
	borderRadius: "6px",
	border: "1px solid #e2e8f0",
};

const link = {
	color: "#0891b2",
	textDecoration: "none",
	fontSize: "14px",
	wordBreak: "break-all" as const,
};

const footerSection = {
	padding: "0 20px",
	borderTop: "1px solid #e2e8f0",
	paddingTop: "32px",
	textAlign: "center" as const,
};

const footerText = {
	color: "#94a3b8",
	fontSize: "12px",
	lineHeight: "1.5",
	margin: "0 0 8px",
};

const supportLink = {
	color: "#10b981",
	textDecoration: "none",
};
