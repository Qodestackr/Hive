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

interface WelcomeEmailProps {
	name: string;
	organizationName?: string;
	loginUrl?: string;
}

export function WelcomeEmail({
	name,
	organizationName,
	loginUrl = "https://promco.co/sign-in",
}: WelcomeEmailProps): JSX.Element {
	return (
		<Html>
			<Head />
			<Preview>
				Welcome to Promco Platform
				{organizationName ? ` - ${organizationName}` : ""}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Img
						src="https://promco.co/logo.png"
						width="170"
						height="50"
						alt="Promco Platform"
						style={logo}
					/>
					<Heading style={h1}>Welcome to Promco Platform! 🎉</Heading>
					<Text style={text}>Hi {name},</Text>
					<Text style={text}>
						Welcome to Promco Platform
						{organizationName ? ` for ${organizationName}` : ""}! We're excited
						to have you on board. Your account has been successfully created and
						you're ready to start managing your business operations.
					</Text>
					<Section style={features}>
						<Text style={featureTitle}>Maximize ROI with Promco:</Text>
						<Text style={featureItem}>
							📊 Optimize inventory to reduce carrying costs and stockouts
						</Text>
						<Text style={featureItem}>
							💰 Gain actionable financial insights to increase profit margins
						</Text>
						<Text style={featureItem}>
							📈 Leverage detailed business reports to drive strategic growth
						</Text>
					</Section>
					<Section style={btnContainer}>
						<Button style={button} href={loginUrl}>
							Get Started
						</Button>
					</Section>
					<Text style={text}>
						If you have any questions or need help getting started, don't
						hesitate to reach out to our support team.
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

const features = {
	margin: "32px 0",
	padding: "24px 32px",
	backgroundColor: "#f0fdfa",
	borderLeft: "4px solid #10b981",
	borderRadius: "4px",
};

const featureTitle = {
	color: "#065f46",
	fontSize: "18px",
	fontWeight: "600",
	margin: "0 0 16px",
};

const featureItem = {
	color: "#047857",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0 0 8px",
};

const btnContainer = {
	textAlign: "center" as const,
	margin: "32px 0",
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
	boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)",
};

const footer = {
	color: "#6b7280",
	fontSize: "14px",
	lineHeight: "24px",
	marginTop: "32px",
	padding: "0 32px",
	textAlign: "center" as const,
};
