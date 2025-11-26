"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { motion } from "framer-motion";
import { DollarSign, Shield, TrendingUp, Zap } from "lucide-react";

export function TrustSection() {
	return (
		<section className="py-24 relative overflow-hidden bg-gradient-to-b from-muted/20 via-background to-muted/20 border-y border-border">
			<div className="container px-4 mx-auto relative z-10">
				<div className="max-w-6xl mx-auto">
					{/* The Hook */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-20"
					>
						<h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
							Ever Run a Promo That Felt
							<br />
							<span className="text-muted-foreground">"Successful"...</span>
							<br />
							<span className="text-destructive">
								But Actually Lost You Money?
							</span>
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
							High redemptions. Good revenue numbers. Then the accountant checks
							the books weeks later—you bled cash.
						</p>
					</motion.div>

					{/* The Solution - Outcome Model */}
					<div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
						{/* Left: What We Do */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							className="space-y-6"
						>
							<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
								<span className="text-sm font-semibold text-primary">
									Here's What Changes
								</span>
							</div>

							<h3 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
								You Know the Answer
								<br />
								<span className="text-primary">Before You Hit Send</span>
							</h3>

							<p className="text-lg text-muted-foreground leading-relaxed">
								No more guessing. No more "oops, we lost KES 40K on that promo."
							</p>

							<div className="space-y-4">
								<div className="flex gap-4">
									<div className="flex-shrink-0 mt-1">
										<div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
											<DollarSign className="h-5 w-5 text-success" />
										</div>
									</div>
									<div>
										<p className="font-bold text-foreground mb-1">
											Know Your True Costs
										</p>
										<p className="text-sm text-muted-foreground">
											We track what each bottle actually cost you—not the
											average price, but the real cost of the stock you're about
											to discount.
										</p>
									</div>
								</div>

								<div className="flex gap-4">
									<div className="flex-shrink-0 mt-1">
										<div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
											<Shield className="h-5 w-5 text-warning" />
										</div>
									</div>
									<div>
										<p className="font-bold text-foreground mb-1">
											See Profit Impact Before Launch
										</p>
										<p className="text-sm text-muted-foreground">
											Know if your promo makes or loses money before you approve
											it. No guessing, no surprises.
										</p>
									</div>
								</div>

								<div className="flex gap-4">
									<div className="flex-shrink-0 mt-1">
										<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
											<Zap className="h-5 w-5 text-primary" />
										</div>
									</div>
									<div>
										<p className="font-bold text-foreground mb-1">
											Real-Time Profit Alerts
										</p>
										<p className="text-sm text-muted-foreground">
											If a campaign turns unprofitable, we alert you immediately
											so you can act fast.
										</p>
									</div>
								</div>
							</div>
						</motion.div>

						{/* Right: How We Get Paid */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.2 }}
						>
							<Card className="border-2 border-primary/50 shadow-2xl bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
								{/* Grandfather Badge */}
								<div className="absolute top-0 right-0 bg-success text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
									EARLY USERS: NO BASE FEE
								</div>

								<CardContent className="p-8">
									<div className="mb-8 mt-6">
										<div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
											<TrendingUp className="h-8 w-8 text-primary" />
										</div>
										<h3 className="text-2xl font-bold text-foreground mb-2">
											We Only Win When You Win
										</h3>
										<p className="text-sm text-muted-foreground">
											Zero risk. Zero guessing. Pure alignment.
										</p>
									</div>

									<div className="space-y-6 mb-8">
										<div className="p-6 rounded-xl bg-muted/50 border border-border/50">
											<div className="flex items-baseline justify-center gap-2 mb-2">
												<span className="text-5xl font-bold text-foreground">
													5%
												</span>
												<span className="text-xl text-muted-foreground font-medium">
													of profit
												</span>
											</div>
											<p className="text-xs text-center text-muted-foreground font-medium">
												Only charged on <strong>ACTUAL profit</strong> we help
												you create
											</p>
										</div>

										<div className="space-y-3">
											<div className="flex items-start gap-3 text-sm">
												<span className="text-success font-bold text-lg">
													✓
												</span>
												<span className="text-muted-foreground">
													Campaign loses money?{" "}
													<strong className="text-foreground">
														We get KES 0
													</strong>
												</span>
											</div>
											<div className="flex items-start gap-3 text-sm">
												<span className="text-success font-bold text-lg">
													✓
												</span>
												<span className="text-muted-foreground">
													Campaign makes KES 100K profit?{" "}
													<strong className="text-foreground">
														We get KES 5K
													</strong>
												</span>
											</div>
											<div className="flex items-start gap-3 text-sm">
												<span className="text-success font-bold text-lg">
													✓
												</span>
												<span className="text-muted-foreground">
													Early users pay{" "}
													<strong className="text-foreground">
														zero base fees
													</strong>
													—just profit share
												</span>
											</div>
										</div>
									</div>

									<Button className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
										Get Started
									</Button>
									<p className="text-xs text-center text-muted-foreground mt-4">
										Setup takes 10 minutes. First profit check is free.
									</p>
								</CardContent>
							</Card>
						</motion.div>
					</div>

					{/* Final CTA */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mt-20"
					>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
							Stop losing money on promos that <em>feel</em> successful.
							<br />
							Start knowing—
							<strong className="text-foreground">before you launch</strong>—if
							you'll make or lose money.
						</p>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
