import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { ResultsSection } from "@/components/landing/results-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { TrustSection } from "@/components/landing/trust-section";

// TODO: https://v0.app/chat/render-react-component-r26RjW0gwdE?ref=HZ5AQG
export default function Home() {
	return (
		<main className="min-h-screen bg-background antialiased">
			<HeroSection />
			<FeaturesSection />
			<TrustSection />
			<ResultsSection />
			<SiteFooter />
		</main>
	);
}
