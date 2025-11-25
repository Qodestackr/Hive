"use client"

import { motion } from "framer-motion"
import { PromoCalculator } from "./promo-calculator"

export function FeaturesSection() {
    const scenarios = [
        "You launch 20% off to drive volume. But you didn't check the latest stock cost. You just paid customers KES 400 per bottle to take your inventory.",
        "You see KES 500K in sales and celebrate. Your true costs were KES 540K. Lost KES 40K. Won't know until the accountant checks next month.",
        "You discount the high-margin item that sells anyway, instead of the slow-moving stock eating up your cash flow."
    ]

    return (
        <section className="py-24 relative overflow-hidden bg-muted/30">
            <div className="container px-4 mx-auto relative z-10 space-y-20">

                {/* Calculator */}
                <div className="space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                            Test Your Next Promo
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Plug in your numbers. See if you're making or losing money.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <PromoCalculator />
                    </motion.div>
                </div>

                {/* Scenarios */}
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                            Three Ways You're Losing Money
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Right now. Without knowing it.
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {scenarios.map((scenario, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-4 items-start p-6 rounded-xl bg-background border-l-4 border-destructive shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex-shrink-0 mt-1">
                                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <span className="text-destructive font-bold text-lg">{i + 1}</span>
                                    </div>
                                </div>
                                <p className="text-lg text-foreground leading-relaxed">
                                    {scenario}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    )
}
