"use client";

import { organization, useSession } from "@repo/auth/client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardFooter } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Progress } from "@repo/ui/components/progress";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { AnimatePresence, type Easing, motion } from "@repo/ui/framer-motion";
import { toast } from "@repo/ui/sonner";
import { APP_BASE_API_URL } from "@repo/utils";
import {
	AlertCircleIcon,
	ArrowRight,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	ImageIcon,
	Info,
	Loader2,
	MapPin,
	Package,
	Smartphone,
	Store,
	Upload,
	Users,
	X,
	Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import PreciseLocationCapture from "@/components/core/map/location-capture";
import { SubscriptionPlans } from "@/components/subscriptions/subscription-plans";
import { useOrganizationId } from "@/hooks/use-organization-id";
import { useWindowSize } from "@/hooks/use-window-size";
import useOnboardingStore from "@/stores/use-onboarding-store";
import TrustMini from "./trust-center";

type Role =
	| "retailer"
	| "wholesaler"
	| "admin"
	| "owner"
	| "bartender"
	| "cashier"
	| "finance"
	| "driver";

const STEPS = [
	{ id: "welcome", label: "Welcome" },
	{ id: "business-details", label: "Business Details" },
	{ id: "location", label: "Location" },
	{ id: "inventory", label: "Inventory" },
	{ id: "payment", label: "Payment" },
	{ id: "team", label: "Team" },
	{ id: "complete", label: "Complete" },
];

export default function OnboardingPage() {
	const router = useRouter();
	const { width, height } = useWindowSize();
	const { data: session } = useSession();
	const organizationId = useOrganizationId();

	const {
		currentStep,
		progress,
		showConfetti,
		isPending,
		businessName,
		businessDescription,
		logoPreview,
		location,
		address,
		preciseLocation,
		paymentMethod,
		subscriptionPlan,
		teamEmails,
		enableSMS,
		phoneNumber,
		// Actions
		goToNextStep,
		goToPreviousStep,
		setBusinessType,
		setBusinessName,
		setBusinessDescription,
		setLocation,
		setAddress,
		setPreciseLocation,
		setWarehouseName,
		setImportMethod,
		setPaymentMethod,
		setSubscriptionPlan,
		setTeamEmails,
		setEnableSMS,
		setPhoneNumber,
		handleLogoChange,
		completeOnboarding,
		skipOnboarding,
		setLogo,
		setLogoPreview,
	} = useOnboardingStore();

	const [isSettingUpProducts, setIsSettingUpProducts] = useState(false);
	const [setupProgress, setSetupProgress] = useState(0);
	const [setupComplete, setSetupComplete] = useState(false);
	const [setupError, setSetupError] = useState<string | null>(null);
	const [forceComplete, setForceComplete] = useState(false);
	const [isInvitingTeam, setIsInvitingTeam] = useState(false);

	const totalSteps = STEPS.length;

	const pollSyncStatus = async (vendorId: string) => {
		try {
			const response = await fetch(
				`${APP_BASE_API_URL}/inventory/import/sync/v2?organizationId=${vendorId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.status === "in-progress") {
				setSetupProgress(data.progress || 0);
				// Continue polling every 1 second
				setTimeout(() => pollSyncStatus(vendorId), 1000);
			} else if (data.status === "completed") {
				setSetupProgress(100);
				setSetupComplete(true);
				setIsSettingUpProducts(false);
				toast.success("Inventory setup completed successfully!");
			} else if (data.status === "failed") {
				setSetupError(data.error || "Setup failed");
				setIsSettingUpProducts(false);
				setSetupProgress(0);
			} else if (data.status === "starting") {
				setSetupProgress(data.progress || 5);
				// Continue polling
				setTimeout(() => pollSyncStatus(vendorId), 1000);
			} else if (data.status === "idle") {
				// No sync in progress, stop polling
				setIsSettingUpProducts(false);
				setSetupProgress(0);
			}
		} catch (error: any) {
			console.error("Polling error:", error.message);
			setSetupError(error instanceof Error ? error.message : "Unknown error");
			setIsSettingUpProducts(false);
		}
	};

	const setupProductInventory = async () => {
		if (!organizationId) {
			toast.error("Organization ID not found");
			return;
		}

		setIsSettingUpProducts(true);
		setSetupError(null);
		setSetupProgress(0);
		setSetupComplete(false); // Ensure clean state

		try {
			const response = await fetch(
				`${APP_BASE_API_URL}/inventory/import/sync/v2?organizationId=${organizationId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						businessName,
						businessDescription,
						location,
						address,
						phoneNumber,
						enableSMS,
					}),
				},
			);

			if (!response.ok) {
				if (response.status === 409) {
					const errorData = await response.json().catch(() => ({}));

					// Sync is already running, start polling
					setSetupProgress(errorData.status?.progress || 10);
					pollSyncStatus(organizationId);

					toast.success("Setup is already running in the background!", {
						description:
							"Your inventory will be ready shortly. Tracking progress...",
						duration: 4000,
					});

					return;
				}

				const errorText = await response.text();
				console.error("❌ Response error:", errorText);
				throw new Error(`HTTP ${response.status}: ${errorText}`);
			}

			const data = await response.json();

			if (data.status === "completed") {
				setSetupProgress(100);
				setSetupComplete(true);
				setIsSettingUpProducts(false);
				toast.success("Inventory setup completed!");
			} else if (data.status === "in-progress" || data.status === "starting") {
				// Start polling to track progress
				setSetupProgress(data.progress || 10);
				pollSyncStatus(organizationId);
				toast.success("Inventory setup started - tracking progress...");
			} else if (data.status === "failed") {
				setSetupError(data.details || data.error || "Setup failed");
				setIsSettingUpProducts(false);
				setSetupProgress(0);
			} else {
				console.warn("Unexpected status:", data.status);
				setSetupError(`Unexpected status: ${data.status}`);
				setIsSettingUpProducts(false);
			}
		} catch (error) {
			console.error("💥 Error setting up product inventory:", error);
			setSetupError(error instanceof Error ? error.message : "Unknown error");
			setIsSettingUpProducts(false);
			setSetupProgress(0);

			toast.error("Failed to set up product inventory", {
				description:
					error instanceof Error ? error.message : "Unknown error occurred",
				duration: 8000,
			});
		}
	};

	const handleNext = goToNextStep;
	const handlePrevious = goToPreviousStep;

	const handleTeamStepNext = async () => {
		if (teamEmails && teamEmails.trim()) {
			await parseAndInviteTeamMembers();
		}
		handleNext();
	};

	const handleSkip = async () => {
		if (!session?.user?.id) {
			toast.error("Session not found");
			router.push(`/dashboard/${organizationId}`);
			return;
		}

		skipOnboarding(session.user.id);
		localStorage.setItem("onboardingProgress", totalSteps.toString());
		sessionStorage.setItem("onboardingDismissed", "true");
		toast.info("You can complete your setup anytime from the dashboard", {
			description: "Look for Onboarding card in your dashboard",
			duration: 5000,
		});
		router.push(`/dashboard/${organizationId}`);
	};

	const handleComplete = async () => {
		if (!session?.user?.id) {
			router.push(`/dashboard/${organizationId}`);
			return;
		}
		await completeOnboarding(session.user.id);
		localStorage.setItem("onboardingProgress", totalSteps.toString());
		sessionStorage.setItem("onboardingDismissed", "true");
		router.push(`/dashboard/${organizationId}`);
	};

	const handleRetrySetup = () => {
		setSetupError(null);
		setSetupComplete(false);
		setIsSettingUpProducts(false);
		setSetupProgress(0);
		setupProductInventory();
	};

	const parseAndInviteTeamMembers = async () => {
		if (
			!teamEmails ||
			!teamEmails.trim() ||
			!organizationId ||
			!session?.user
		) {
			return;
		}

		setIsInvitingTeam(true);

		try {
			const emails = teamEmails
				.split(",")
				.map((email) => email.trim())
				.filter((email) => email.length > 0 && email.includes("@"));

			if (emails.length === 0) {
				toast.info("No valid email addresses found");
				setIsInvitingTeam(false);
				return;
			}

			let defaultRole = "bartender";
			const userRole = session.user.role;

			if (userRole === "retailer") {
				defaultRole = "bartender"; // ops staff retail stores
			} else if (userRole === "wholesaler") {
				defaultRole = "cashier"; // orders + financials for wholesale operations
			} else if (userRole === "admin" || userRole === "owner") {
				defaultRole = "cashier";
			} else {
				defaultRole = "bartender";
			}

			let successCount = 0;
			let errorCount = 0;

			// Import p-limit dynamically to avoid breaking the import
			const pLimit = (await import("p-limit")).default;
			const limit = pLimit(1); // Only 1 concurrent invitation at a time

			// Use p-limit to rate limit invitations
			const invitePromises = emails.map((email) =>
				limit(async () => {
					try {
						await organization.inviteMember({
							email,
							role: defaultRole as Role,
							organizationId,
							fetchOptions: { throw: true },
						});
						successCount++;
					} catch (error: any) {
						console.error(`❌ Failed to invite ${email}:`, error);
						console.error(`Error details:`, {
							message: error.message,
							status: error.status,
							response: error.response,
							stack: error.stack,
						});
						errorCount++;
					}
				}),
			);

			// Wait for all invitations to complete
			await Promise.all(invitePromises);

			if (successCount > 0) {
				toast.success(
					`${successCount} team member${successCount > 1 ? "s" : ""} invited as ${defaultRole}${successCount > 1 ? "s" : ""}!`,
				);
			}
			if (errorCount > 0) {
				toast.error(
					`${errorCount} invitation${errorCount > 1 ? "s" : ""} failed to send`,
				);
			}
		} catch (error: any) {
			toast.error("Failed to send team invitations");
			console.error("Team invitation error:", error);
		} finally {
			setIsInvitingTeam(false);
		}
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
		exit: {
			opacity: 0,
			transition: {
				duration: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.4,
				ease: "easeOut" as Easing,
			},
		},
	};

	// Restore onboarding progress on page load
	useEffect(() => {
		const savedProgress = localStorage.getItem("onboardingProgress");
		const isDismissed = sessionStorage.getItem("onboardingDismissed");

		if (isDismissed === "true") {
			// User has completed or skipped onboarding, don't restore
			return;
		}

		if (savedProgress) {
			const step = parseInt(savedProgress, 10);
			if (step > 0 && step < STEPS.length) {
				// Use setCurrentStep to properly update progress bar
				const store = useOnboardingStore.getState();
				store.setCurrentStep(step);
			}
		}
	}, []);

	// Auto-trigger product setup when reaching inventory step
	useEffect(() => {
		if (
			currentStep === 3 &&
			!isSettingUpProducts &&
			!setupComplete &&
			!setupError
		) {
			console.log("🎯 Triggering inventory setup...");
			setupProductInventory();
		}
	}, [currentStep, isSettingUpProducts, setupComplete, setupError]);

	useEffect(() => {
		localStorage.setItem("onboardingProgress", currentStep.toString());
	}, [currentStep]);
	//  mirror “finished/skipped” in sessionStorage when they hit step 6 or skip:
	// This ensures blocker vanishes immediately when they truly finish.
	useEffect(() => {
		if (currentStep >= STEPS.length - 1) {
			sessionStorage.setItem("onboardingDismissed", "true");
		}
	}, [currentStep]);

	// Force complete after 5 seconds, auto-navigate after 7 seconds
	useEffect(() => {
		if (
			currentStep === 3 &&
			isSettingUpProducts &&
			!setupComplete &&
			!setupError
		) {
			const forceCompleteTimer = setTimeout(() => {
				setForceComplete(true);
			}, 5000);

			const autoNavigateTimer = setTimeout(() => {
				handleNext();
			}, 7000);

			return () => {
				clearTimeout(forceCompleteTimer);
				clearTimeout(autoNavigateTimer);
			};
		}
	}, [currentStep, isSettingUpProducts, setupComplete, setupError]);

	return (
		<div className="max-w-3xl mx-auto bg-gradient-to-b from-background to-background/80 flex flex-col">
			{showConfetti && (
				<Confetti width={width} height={height} recycle={false} />
			)}

			<header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-10 shadow-sm">
				<div className="max-w-3xl flex h-14 items-center justify-between">
					<div className="flex items-center gap-1">
						<Badge
							variant="outline"
							className="ml-1 h-4 font-light text-xs hidden md:flex py-0 px-1.5"
						>
							Setup
						</Badge>
					</div>
					<div className="flex items-center gap-2">
						<div className="hidden md:block">
							<div className="flex items-center gap-1">
								{STEPS.map((step, index) => (
									<div
										key={step.id}
										className={`flex items-center ${index > 0 ? "ml-0.5" : ""}`}
									>
										{index > 0 && (
											<ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
										)}
										<span
											className={`text-xs ${
												currentStep === index
													? "font-medium text-primary"
													: currentStep > index
														? "text-muted-foreground"
														: "text-muted-foreground/50"
											}`}
										>
											{step.label}
										</span>
									</div>
								))}
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSkip}
							className="text-xs"
						>
							Skip
						</Button>
					</div>
				</div>
				<div className="w-full h-0.5">
					<Progress value={progress} className="h-0.5 rounded-none" />
				</div>
			</header>

			<main className="flex-1 container py-4 md:py-8">
				<div className="max-w-3xl mx-auto">
					<AnimatePresence mode="wait">
						{currentStep === 0 && (
							<motion.div
								key="welcome"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-6"
							>
								<motion.div
									variants={itemVariants}
									className="text-center space-y-3"
								>
									<div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
										<Zap className="h-8 w-8 text-emerald-600" />
									</div>
									<h1 className="text-xl font-normal tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
										Welcome to Alcora
									</h1>
									<p className="text-muted-foreground max-w-md mx-auto text-sm">
										Complete account setup to streamline your business
										operations.
									</p>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="flex flex-wrap gap-3 mt-4 justify-center"
								>
									<Card className="p-1 border-primary/20 shadow-sm hover:shadow-md transition-shadow flex-1 min-w-0 max-w-[160px]">
										<CardContent className="p-1">
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-1.5">
													<Clock className="h-6 w-6 text-teal-700" />
													<h3 className="font-normal text-sm text-center">
														Quick Setup
													</h3>
												</div>
												<p className="text-xs text-muted-foreground text-center">
													Complete in minutes
												</p>
											</div>
										</CardContent>
									</Card>

									<Card className="p-1 border-primary/20 shadow-sm hover:shadow-md transition-shadow flex-1 min-w-0 max-w-[160px]">
										<CardContent className="p-1">
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-1.5">
													<Smartphone className="h-6 w-6 text-teal-700" />
													<h3 className="font-normal text-sm text-center">
														Mobile Friendly
													</h3>
												</div>
												<p className="text-xs text-muted-foreground text-center">
													Manage anywhere
												</p>
											</div>
										</CardContent>
									</Card>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="flex items-center justify-center gap-1 mt-2"
								>
									<Button
										variant="outline"
										onClick={handleSkip}
										className="text-muted-foreground border-slate-400 font-normal text-sm h-8 bg-transparent"
									>
										Skip for now
									</Button>
									<Button
										size="default"
										onClick={handleNext}
										className="cursor-pointer h-8 bg-emerald-700 hover:bg-emerald-800 font-normal text-white shadow-md hover:shadow-lg transition-all"
									>
										Start Setup
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</motion.div>
								<div className="max-w-2xl mx-auto">
									<TrustMini />
								</div>
							</motion.div>
						)}

						{currentStep === 1 && (
							<motion.div
								key="business-details"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-6"
							>
								<motion.div variants={itemVariants} className="space-y-1">
									<h2 className="text-xl font-light tracking-tight">
										Tell us about your business
									</h2>
									<p className="text-muted-foreground text-sm">
										Add your business details and upload your logo.
									</p>
								</motion.div>

								<motion.div variants={itemVariants} className="space-y-4">
									<div className="grid gap-1.5">
										<Label htmlFor="business-name" className="text-sm">
											Business Name
										</Label>
										<Input
											id="business-name"
											placeholder="e.g., Premium Distributors Ltd"
											value={businessName}
											onChange={(e) => setBusinessName(e.target.value)}
											className="h-9"
										/>
									</div>

									<div className="grid gap-1.5">
										<Label htmlFor="business-description" className="text-sm">
											Business Description (Optional)
										</Label>
										<Textarea
											id="business-description"
											placeholder="Tell us a bit about your business..."
											value={businessDescription}
											onChange={(e) => setBusinessDescription(e.target.value)}
											rows={2}
											className="resize-none text-sm"
										/>
									</div>

									<div className="grid gap-1.5">
										<Label htmlFor="logo" className="text-sm font-medium">
											Business Logo (Used for Shop Banners)
										</Label>
										<Card className="border-dashed border-2 p-4 transition-colors hover:border-primary/50">
											<div className="flex items-center gap-4">
												<div className="h-20 w-20 border-2 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60 flex-shrink-0 transition-all duration-200">
													{logoPreview ? (
														<Image
															src={`${logoPreview}`}
															alt="Logo preview"
															width={80}
															height={80}
															className="object-contain rounded-md"
														/>
													) : (
														<div className="flex flex-col items-center gap-1">
															<ImageIcon className="h-8 w-8 text-muted-foreground/60" />
															<span className="text-xs text-muted-foreground/80 font-medium">
																Logo
															</span>
														</div>
													)}
												</div>
												<div className="flex-1 w-full">
													<Input
														id="logo"
														type="file"
														accept="image/*"
														onChange={handleLogoChange}
														className="hidden"
													/>
													<div className="grid gap-3">
														<Button
															asChild
															variant="outline"
															className="w-full h-10 text-sm font-medium border-2 hover:border-primary/50 transition-colors bg-transparent"
														>
															<label
																htmlFor="logo"
																className="cursor-pointer flex items-center justify-center gap-2"
															>
																<Upload className="h-4 w-4" />
																{logoPreview ? "Change Logo" : "Upload Logo"}
															</label>
														</Button>
														{logoPreview && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setLogo(null);
																	setLogoPreview(null);
																	const fileInput = document.getElementById(
																		"logo",
																	) as HTMLInputElement;
																	if (fileInput) fileInput.value = "";
																}}
																className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8 transition-colors"
															>
																<X className="h-3 w-3 mr-1" />
																Remove Logo
															</Button>
														)}
													</div>
													<div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
														<p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
															✨ We'll automatically optimize, compress & trim
															your logo to perfect dimensions
														</p>
													</div>
													<p className="text-xs text-muted-foreground mt-2">
														Square image recommended • PNG/JPG • Min 200x200px
													</p>
												</div>
											</div>
										</Card>
									</div>

									<div className="grid gap-1.5">
										<Label htmlFor="phone-number" className="text-sm">
											Phone Number
										</Label>
										<div className="flex gap-2">
											<div className="w-16">
												<Input
													id="country-code"
													value="+254"
													disabled
													className="h-9 bg-muted/50 text-sm"
												/>
											</div>
											<div className="flex-1">
												<Input
													id="phone-number"
													placeholder="712 345 678"
													value={phoneNumber}
													onChange={(e) => setPhoneNumber(e.target.value)}
													className="h-9 text-sm"
												/>
											</div>
										</div>
										<div className="flex items-center space-x-2 mt-1">
											<Switch
												id="enable-sms"
												checked={enableSMS}
												onCheckedChange={setEnableSMS}
												className="h-4 w-7 data-[state=checked]:bg-primary"
											/>
											<Label
												htmlFor="enable-sms"
												className="text-xs cursor-pointer"
											>
												Enable SMS & WhatsApp notifications for orders, sales
												summary, and inventory alerts
											</Label>
										</div>
									</div>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="flex justify-between pt-3"
								>
									<Button
										variant="outline"
										onClick={handlePrevious}
										className="flex items-center gap-1 text-sm h-9 bg-transparent"
									>
										<ChevronLeft className="h-4 w-4" />
										Back
									</Button>
									<Button
										onClick={handleNext}
										disabled={!businessName}
										className={`text-sm h-9 ${businessName ? "bg-emerald-700 hover:bg-emerald-900 text-white" : ""}`}
									>
										Continue
										<ChevronRight className="ml-2 h-4 w-4" />
									</Button>
								</motion.div>
							</motion.div>
						)}
						{currentStep === 2 && (
							<motion.div
								key="location"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-4"
							>
								<motion.div variants={itemVariants} className="space-y-1">
									<h2 className="text-xl font-light tracking-tight">
										Where are you located?
									</h2>
									<p className="text-muted-foreground text-sm">
										Add your business location and warehouse details.
									</p>
								</motion.div>

								<motion.div variants={itemVariants} className="space-y-2">
									{/* Precise Location Capture */}
									<div className="grid gap-1.5">
										<PreciseLocationCapture
											defaultLocation={location}
											defaultAddress={address}
											onLocationConfirmed={(location) => {
												console.log("Outlet location:", location);
												// Store the complete precise location data
												setPreciseLocation(location);
												// Update the address field with the building name from location capture
												if (location.buildingName) {
													setAddress(location.buildingName);
												}
												// Update the location field with the locality if available
												if (location.locality) {
													setLocation(location.locality);
												}
											}}
										/>
									</div>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="bg-muted/50 rounded-lg p-1.5 flex gap-2 items-start border border-muted"
								>
									<div className="rounded-full outline-none flex-shrink-0">
										<MapPin className="h-6 w-6 text-teal-600" />
									</div>
									<div>
										<h3 className="font-normal text-teal-600 text-sm">
											Why we need your location
										</h3>
										<p className="text-xs text-muted-foreground">
											Your location helps us optimize delivery routes and
											connect you with nearby businesses.
										</p>
									</div>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="flex justify-between pt-3"
								>
									<Button
										variant="outline"
										onClick={handlePrevious}
										className="flex items-center gap-1 text-sm h-9 bg-transparent"
									>
										<ChevronLeft className="h-4 w-4" />
										Back
									</Button>
									<Button
										onClick={handleNext}
										disabled={!preciseLocation}
										className={`text-sm h-9 ${preciseLocation ? "bg-emerald-700 hover:bg-emerald-900 text-white" : ""}`}
									>
										Continue
										<ChevronRight className="ml-2 h-4 w-4" />
									</Button>
								</motion.div>
							</motion.div>
						)}

						{currentStep === 3 && (
							<motion.div
								key="inventory"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-6"
							>
								<motion.div
									variants={itemVariants}
									className="flex flex-col justify-center items-center space-y-1"
								>
									<h2 className="text-xl font-normal tracking-tight">
										Setting Up Your Inventory
									</h2>
									<p className="text-muted-foreground text-sm">
										We're automatically importing popular products for your
										business.
									</p>
								</motion.div>

								<motion.div variants={itemVariants} className="space-y-6 py-4">
									<div className="flex flex-col items-center justify-center text-center space-y-4">
										<div className="relative w-20 h-20">
											<div className="absolute inset-0 flex items-center justify-center">
												<Package
													className={`h-8 w-8 text-emerald-800 ${setupComplete ? "" : "animate-pulse"}`}
												/>
											</div>
											<svg
												className="w-20 h-20 -rotate-90"
												viewBox="0 0 100 100"
											>
												<circle
													className="text-green-500 stroke-current"
													strokeWidth="4"
													fill="transparent"
													r="40"
													cx="50"
													cy="50"
												/>
												<circle
													className="text-emerald-700 stroke-current"
													strokeWidth="4"
													strokeLinecap="round"
													fill="transparent"
													r="40"
													cx="50"
													cy="50"
													strokeDasharray={`${2 * Math.PI * 40}`}
													strokeDashoffset={`${2 * Math.PI * 40 * (1 - setupProgress / 100)}`}
												/>
											</svg>
										</div>

										<div className="space-y-2">
											<h3 className="text-lg font-normal">
												{setupComplete
													? "Setup complete!"
													: setupError
														? "Setup failed"
														: "Setting up your store..."}
											</h3>
											<p className="text-sm text-muted-foreground max-w-md">
												{setupComplete
													? "We've added the most popular products to your inventory. Customize quantities and prices later."
													: setupError
														? `Error: ${setupError}`
														: "We're creating products for you from our catalog of beverages (alcoholic)."}
											</p>
										</div>

										{isSettingUpProducts && !setupComplete && (
											<div className="bg-muted/50 border border-muted rounded-lg p-4 max-w-md text-sm mt-4">
												<div className="flex items-center gap-3">
													<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
													<div className="flex flex-col">
														<span className="font-medium">
															Syncing inventory in the background...
														</span>
														<span className="text-xs text-muted-foreground">
															You can continue while we finish up.
														</span>
													</div>
												</div>
											</div>
										)}

										{!setupComplete && !setupError && (
											<div className="w-full max-w-md space-y-2">
												<Progress value={setupProgress} className="h-2" />
												<div className="flex justify-between text-xs text-muted-foreground">
													<span>Importing products...</span>
													<span>{setupProgress}%</span>
												</div>
											</div>
										)}

										{setupError && (
											<div className="space-y-3">
												<div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-md">
													<h4 className="text-sm font-medium text-red-800 mb-1">
														Setup Failed
													</h4>
													<p className="text-sm text-red-600">{setupError}</p>
												</div>
												<Button
													onClick={handleRetrySetup}
													variant="outline"
													size="sm"
												>
													Retry Setup
												</Button>
											</div>
										)}

										{setupComplete && (
											<div className="bg-muted/50 rounded-lg p-3 max-w-md text-left">
												<h4 className="text-lg font-normal flex items-center gap-1.5">
													<Info className="h-4 w-4 text-emerald-600" />
													What's next?
												</h4>
												<ul className="mt-2 space-y-1">
													<li className="text-sm flex items-start gap-1.5">
														<CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
														<span>
															All products have been added with{" "}
															<strong>KES 1</strong> price and{" "}
															<strong>0</strong> quantity
														</span>
													</li>
													<li className="text-sm flex items-start gap-1.5">
														<CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
														<span>
															Update the prices and quantities to reflect your
															actual inventory
														</span>
													</li>
													<li className="text-sm flex items-start gap-1.5">
														<AlertCircleIcon className="h-4 w-4 text-teal-900 mt-0.5" />
														<span className="text-teal-900">
															Products will become available for sale once you
															set a real price and quantity
														</span>
													</li>
												</ul>
											</div>
										)}
									</div>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="flex justify-between pt-2"
								>
									<Button
										variant="outline"
										onClick={handlePrevious}
										className="flex items-center gap-1 text-xs h-8 bg-transparent"
									>
										<ChevronLeft className="h-4 w-4" />
										Back
									</Button>
									<Button
										onClick={handleNext}
										className={`text-xs h-8 ${
											setupComplete || setupError || forceComplete
												? "bg-emerald-700 hover:bg-emerald-900 text-white"
												: "bg-primary/70 hover:bg-primary text-white"
										}`}
									>
										{setupComplete || setupError || forceComplete ? (
											<>
												Continue
												<ChevronRight className="ml-2 h-4 w-4" />
											</>
										) : (
											<>
												<Loader2 className="h-3 w-3 animate-spin mr-2" />
												Setting up...
											</>
										)}
									</Button>
								</motion.div>
							</motion.div>
						)}
						<div className="max-w-4xl mx-auto">
							{currentStep === 4 && (
								<motion.div
									key="payment"
									variants={containerVariants}
									initial="hidden"
									animate="visible"
									exit="exit"
									className="space-y-6"
								>
									<motion.div
										variants={itemVariants}
										className="space-y-4 max-w-3xl mx-auto"
									>
										<SubscriptionPlans
											businessType="RETAILER"
											onSubscriptionCreated={() => {
												console.log("✅ Subscription created successfully!");
											}}
										/>
									</motion.div>

									<motion.div
										variants={itemVariants}
										className="flex justify-between pt-3"
									>
										<Button
											variant="outline"
											onClick={handlePrevious}
											className="flex items-center gap-1 text-sm h-9 bg-transparent"
										>
											<ChevronLeft className="h-4 w-4" />
											Back
										</Button>
										<Button
											onClick={handleNext}
											className="bg-emerald-700 hover:bg-emerald-900 text-white text-sm h-9"
										>
											Continue
											<ChevronRight className="ml-2 h-4 w-4" />
										</Button>
									</motion.div>
								</motion.div>
							)}
						</div>

						{/* Team Step */}
						{currentStep === 5 && (
							<motion.div
								key="team"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-6"
							>
								<motion.div variants={itemVariants} className="space-y-1">
									<h2 className="text-xl font-light tracking-tight">
										Invite Your Team (Can Skip)
									</h2>
									<p className="text-muted-foreground text-sm">
										Add team members to collaborate with you on Alcorabooks.
									</p>
								</motion.div>

								<motion.div variants={itemVariants} className="space-y-2">
									<Card className="border-primary/20 shadow-sm">
										<CardContent className="p-2 space-y-2">
											<div className="flex items-start gap-2">
												<div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
													<Users className="h-4 w-4 text-primary" />
												</div>
												<div>
													<h3 className="font-normal text-sm">
														Team Collaboration
													</h3>
													<p className="text-xs text-muted-foreground mt-1">
														Invite team members to help manage your inventory,
														orders, and more.
													</p>
												</div>
											</div>

											<div className="grid gap-1.5">
												<Label
													htmlFor="team-emails"
													className="text-sm font-normal"
												>
													Team Member Emails
												</Label>
												<Textarea
													id="team-emails"
													placeholder="Enter email addresses, separated by commas..."
													value={teamEmails}
													onChange={(e) => setTeamEmails(e.target.value)}
													rows={3}
													className="resize-none text-sm border-gray-100"
												/>
												<p className="text-xs text-green-700">
													Separate multiple email addresses with a comma e.g
													newliqour@james.com
													<span className="font-semibold mx-1">,</span>{" "}
													joan@gmail.com.
												</p>
												{session?.user?.role && (
													<div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
														<p className="text-xs text-blue-700">
															💡 Team members will be invited as{" "}
															<span className="font-semibold">
																{session.user.role === "retailer"
																	? "bartenders"
																	: session.user.role === "wholesaler"
																		? "cashiers"
																		: session.user.role === "admin" ||
																				session.user.role === "owner"
																			? "cashiers"
																			: "bartenders"}
															</span>{" "}
															based on your {session.user.role} role. Edit
															later.
														</p>
													</div>
												)}
												{teamEmails && teamEmails.trim() && (
													<div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
														<h5 className="text-xs font-medium text-blue-700 mb-1">
															Emails to invite (
															{
																teamEmails
																	.split(",")
																	.filter((email) => email.trim().includes("@"))
																	.length
															}
															):
														</h5>
														<div className="flex flex-wrap gap-1">
															{teamEmails
																.split(",")
																.map((email) => email.trim())
																.filter((email) => email.includes("@"))
																.map((email, index) => (
																	<span
																		key={index}
																		className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border"
																	>
																		{email}
																	</span>
																))}
														</div>
													</div>
												)}
											</div>

											<div className="bg-muted/50 p-3 rounded-lg space-y-2">
												<h4 className="text-xs font-medium">
													Team members will be able to:
												</h4>
												<ul className="space-y-1">
													<li className="text-xs flex items-start gap-1.5">
														<CheckCircle className="h-3 w-3 text-primary mt-0.5" />
														<span>
															View and manage inventory based on their
															permissions
														</span>
													</li>
													<li className="text-xs flex items-start gap-1.5">
														<CheckCircle className="h-3 w-3 text-primary mt-0.5" />
														<span>Process orders and generate invoices</span>
													</li>
													<li className="text-xs flex items-start gap-1.5">
														<CheckCircle className="h-3 w-3 text-primary mt-0.5" />
														<span>Access reports and analytics</span>
													</li>
												</ul>
											</div>
										</CardContent>
										<CardFooter className="bg-muted/30 px-4 py-2">
											<p className="text-xs text-muted-foreground">
												You can set specific permissions for each team member
												after they join.
											</p>
										</CardFooter>
									</Card>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="flex justify-between pt-3"
								>
									<Button
										variant="outline"
										onClick={handlePrevious}
										className="flex items-center gap-1 text-sm h-9 bg-transparent"
									>
										<ChevronLeft className="h-4 w-4" />
										Back
									</Button>
									<Button
										onClick={handleTeamStepNext}
										disabled={isInvitingTeam}
										className="bg-emerald-700 hover:bg-emerald-900 text-white text-sm h-9"
									>
										{isInvitingTeam ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin mr-2" />
												Inviting Team...
											</>
										) : (
											<>
												Continue
												<ChevronRight className="ml-2 h-4 w-4" />
											</>
										)}
									</Button>
								</motion.div>
							</motion.div>
						)}

						{/* Complete Step */}
						{currentStep === 6 && (
							<motion.div
								key="complete"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-6"
							>
								<motion.div
									variants={itemVariants}
									className="text-center space-y-2"
								>
									<div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
										<CheckCircle className="h-8 w-8 text-emerald-600" />
									</div>
									<h1 className="text-xl font-normal tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
										You're All Set!
									</h1>
									<p className="text-muted-foreground max-w-md mx-auto text-xs">
										Your account has been successfully set up.
									</p>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="bg-muted/30 rounded-lg p-4 border border-muted"
								>
									<h3 className="font-normal mb-1 text-md">Setup Summary</h3>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div className="space-y-0.5">
											<span className="text-xs text-muted-foreground">
												Business Name
											</span>
											<p className="font-normal">
												{businessName || "Not specified"}
											</p>
										</div>
										<div className="space-y-0.5">
											<span className="text-xs text-muted-foreground">
												Location
											</span>
											<p className="font-normal">
												{location || "Not specified"}
											</p>
										</div>
										<div className="space-y-0.5">
											<span className="text-xs text-muted-foreground">
												Subscription Plan
											</span>
											<p className="font-normal capitalize">
												{subscriptionPlan || "Free Trial"}
											</p>
										</div>
										<div className="space-y-0.5">
											<span className="text-xs text-muted-foreground">
												Payment Method
											</span>
											<p className="font-normal capitalize">
												{paymentMethod || "Not selected"}
											</p>
										</div>
									</div>
								</motion.div>

								<motion.div variants={itemVariants} className="space-y-2">
									<h3 className="font-normal text-md">Next Steps</h3>
									<div className="grid grid-cols-3 gap-1">
										<Card className="p-1.5 border-primary/20 hover:shadow-md transition-shadow">
											<CardContent className="p-1.5">
												<div className="flex flex-col items-center text-center gap-1">
													<div className="bg-emerald-100 p-2 rounded-full">
														<Package className="h-5 w-5 text-emerald-600" />
													</div>
													<div>
														<h3 className="font-normal text-sm">
															Manage Inventory
														</h3>
														<p className="text-xs text-muted-foreground">
															Update quantity and prices
														</p>
													</div>
												</div>
											</CardContent>
										</Card>

										<Card className="p-1.5 border-primary/20 hover:shadow-md transition-shadow">
											<CardContent className="p-1.5">
												<div className="flex flex-col items-center text-center gap-1">
													<div className="bg-emerald-100 p-2 rounded-full">
														<Users className="h-5 w-5 text-emerald-600" />
													</div>
													<div>
														<h3 className="font-normal text-sm">Team Setup</h3>
														<p className="text-xs text-muted-foreground">
															Configure team access further
														</p>
													</div>
												</div>
											</CardContent>
										</Card>

										<Card className="p-1.5 border-primary/20 hover:shadow-md transition-shadow">
											<CardContent className="p-1.5">
												<div className="flex flex-col items-center text-center gap-1">
													<div className="bg-emerald-100 p-2 rounded-full">
														<Store className="h-5 w-5 text-emerald-600" />
													</div>
													<div>
														<h3 className="font-normal text-sm">
															Connect Partners
														</h3>
														<p className="text-xs text-muted-foreground">
															Find suppliers for online orders
														</p>
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className="flex flex-col items-center gap-2 pt-1"
								>
									<Button
										size="default"
										onClick={handleComplete}
										className="w-full max-w-sm h-8 bg-emerald-700 hover:bg-emerald-800 cursor-pointer text-white shadow-md hover:shadow-lg transition-all text-sm"
										disabled={isPending}
									>
										{isPending ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin mr-2" />
												Setting up your account...
											</>
										) : (
											<>
												Finalize
												<ArrowRight className="ml-2 h-4 w-4" />
											</>
										)}
									</Button>
									<p className="text-xs text-muted-foreground">
										Need help?{" "}
										<a href="#" className="text-primary hover:underline">
											Contact our support team
										</a>
									</p>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</main>
		</div>
	);
}
