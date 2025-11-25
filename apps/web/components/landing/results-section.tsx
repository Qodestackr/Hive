"use client"

import { motion } from "framer-motion"
import { Quote, Star } from "lucide-react"
import { Card, CardContent } from "@repo/ui/components/card"

export function ResultsSection() {
    const testimonials = [
        {
            quote: "I was about to run 30% off Hennessy. Promco showed me I'd lose KES 18,000. Adjusted to 15% and made KES 12,000 instead.",
            author: "David Kimani",
            role: "Owner, Nairobi Wines & Spirits",
            metric: "KES 180K Saved",
        },
        {
            quote: "We ran promos every week but never knew which ones actually made money. Now we know before we even launch.",
            author: "Fatuma Hassan",
            role: "Operations Manager, Mombasa Distributors",
            metric: "94% Profit Boost",
        },
        {
            quote: "The calculator alone is worth it. We check every promo idea now. Last month we killed 3 campaigns that would have lost us money.",
            author: "James Omondi",
            role: "Director, Coast Beverages Ltd",
            metric: "KES 65K Saved",
        },
    ]

    return (
        <section className="py-24 relative overflow-hidden bg-muted/30">
            <div className="container px-4 mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                        Distributors Are Saving Millions
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Join the distributors who stopped guessing and started knowing.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {testimonials.map((testimonial, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                        >
                            <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 h-full bg-background">
                                <CardContent className="p-8 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-6">
                                        <Quote className="h-8 w-8 text-primary/20 flex-shrink-0" />
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            ))}
                                        </div>
                                    </div>

                                    <blockquote className="text-base leading-relaxed mb-6 flex-grow text-foreground font-medium">
                                        "{testimonial.quote}"
                                    </blockquote>

                                    <div className="pt-6 border-t border-border">
                                        <div className="font-bold text-foreground">
                                            {testimonial.author}
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-2">
                                            {testimonial.role}
                                        </div>
                                        <div className="text-sm font-bold text-success">
                                            {testimonial.metric}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
