"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@repo/ui/components/button"

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden bg-background">
            <div className="container px-4 mx-auto relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Main Headline - Pain First */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8 mb-12"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-foreground">
                            How much did your last promo{" "}
                            <span className="text-error">actually cost you?</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                            You see revenue. You don't see the hidden costs eating your margin. <span className="text-foreground font-bold">We do.</span>
                        </p>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
                    >
                        <Button
                            size="lg"
                            className="h-14 px-10 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground"
                            style={{
                                borderRadius: 'var(--radius-full)',
                            }}
                        >
                            Check Your Real Profit
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>

                    {/* Stats Strip - Compact & High Contrast */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-border pt-12"
                    >
                        {[
                            { value: "KES 40K+", label: "Avg. Monthly Loss Prevented" },
                            { value: "< 5 Min", label: "Setup Time" },
                            { value: "100%", label: "Profit Transparency" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
