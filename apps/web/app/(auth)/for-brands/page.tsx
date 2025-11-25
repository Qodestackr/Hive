"use client"

import type React from "react"
import { motion } from "@repo/ui/framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
    ArrowRight,
    BarChart3,
    Building,
    ChevronRight,
    Crown,
    Globe,
    Network,
    Shield,
    Sparkles,
    TrendingUp,
    Zap,
} from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { Card, CardContent } from "@repo/ui/components/card"
import { Badge } from "@repo/ui/components/badge"

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
}

export default function BrandLandingPage() {
    return (
        <div className="bg-gradient-to-b from-white via-gray-50/30 to-white dark:bg-background">
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white py-2">
                <div className="container text-center">
                    <p className="text-sm flex items-center justify-center gap-2">
                        <Crown className="h-4 w-4" />
                        <span>Exclusive Brand Owner Access</span>
                    </p>
                </div>
            </div>
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-5">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="container relative z-10 pt-10 pb-10">
                    <div className="max-w-5xl mx-auto text-center">
                        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                            <motion.div variants={fadeInUp} className="mb-3">
                                <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-emerald-200 text-emerald-800">
                                    <Sparkles className="h-3 w-3 mr-2" />
                                    The Liquor Industry's Operating System
                                </Badge>
                            </motion.div>

                            <motion.h1
                                variants={fadeInUp}
                                className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 mb-2 leading-tight"
                            >
                                Command Your
                                <span className="block mt-1 bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent font-normal">
                                    Distribution Empire
                                </span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                                Promco isn't just software — it's the command center that powers East Africa's most successful liquor
                                brands. From established players to emerging distilleries, we're the invisible infrastructure behind every smart move.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                                <Button
                                    size="sm"
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 h-10 text-sm shadow-lg group"
                                    asChild
                                >
                                    <Link href="/for-brands/request-access">
                                        <span className="group-hover:translate-x-0.5 transition-transform">Request Access</span>
                                        <Crown className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-6 h-10 text-sm group"
                                    asChild
                                >
                                    <Link href="/for-brands/demo">
                                        <span className="group-hover:translate-x-0.5 transition-transform">Private Demo</span>
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="relative">
                                <div className="mx-auto w-full max-w-3xl rounded-xl overflow-hidden border border-gray-100 shadow-xl bg-white p-0.5">
                                    <div className="relative aspect-[2/1] w-full">
                                        <Image
                                            src="/marketing/placeholder.svg"
                                            alt="Promco Brand Command Center - The OS for Liquor Distribution"
                                            fill
                                            className="w-full rounded-xl"
                                            priority
                                        />
                                    </div>
                                </div>

                                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-8 py-3 rounded-full text-sm font-medium shadow-xl flex items-center">
                                        <Zap className="h-4 w-4 mr-2 fill-current" />
                                        Engine Powering Liquor Giants
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="py-5 bg-white border-y border-gray-100">
                <div className="container">
                    <div className="text-center mb-3">
                        <h2 className="text-2xl font-light text-gray-700 mb-2">The Infrastructure Behind Industry Leaders</h2>
                        <p className="text-gray-500">Trusted by the brands that move liquor economy</p>
                    </div>
                </div>
            </section>

            {/* Core Capabilities - Ultra Compact */}
            <section className="py-3 mx-auto bg-gradient-to-b from-white to-gray-50/50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <Badge variant="outline" className="mb-2 px-4 py-1.5 text-sm border-emerald-200 text-emerald-800">
                            Enterprise Command Center
                        </Badge>
                        <h2 className="text-3xl font-light text-gray-900 mb-3">Built for Brand Dominance</h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Every tool you need to command your distribution network and scale with surgical precision.
                        </p>
                    </div>

                    {/* Compact 2x3 Grid */}
                    <motion.div
                        className="grid grid-cols-1 max-w-4xl mx-auto md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={staggerContainer}
                    >
                        <CompactFeatureCard
                            icon={Network}
                            title="Distribution Intelligence"
                            description="Real-time network visibility. Every bottle, every route, every opportunity."
                            color="emerald"
                        />
                        <CompactFeatureCard
                            icon={BarChart3}
                            title="Predictive Analytics"
                            description="AI-powered demand forecasting. Know what's selling before your competition."
                            color="teal"
                        />
                        <CompactFeatureCard
                            icon={TrendingUp}
                            title="Campaign Command"
                            description="Deploy promotions instantly. Track performance. Optimize on the fly."
                            color="emerald"
                        />
                        <CompactFeatureCard
                            icon={Globe}
                            title="Logistics Mastery"
                            description="End-to-end delivery orchestration with predictive routing."
                            color="teal"
                        />
                        <CompactFeatureCard
                            icon={Shield}
                            title="Enterprise Security"
                            description="Bank-grade security with SSO and comprehensive audit trails."
                            color="emerald"
                        />
                        <CompactFeatureCard
                            icon={Building}
                            title="Ecosystem Integration"
                            description="Seamlessly connects with your ERP, BI tools, and existing systems."
                            color="teal"
                        />
                    </motion.div>

                    {/* Inline Stats - Single Row */}
                    <div className="grid md:grid-cols-3 max-w-4xl mx-auto gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-center">
                            <div className="text-3xl font-light text-emerald-700 mb-1">98%</div>
                            <div className="text-sm font-medium text-gray-900">Accuracy Rate</div>
                            <div className="text-xs text-gray-600">Order processing precision</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-light text-emerald-700 mb-1">4.8x</div>
                            <div className="text-sm font-medium text-gray-900">Faster Fulfillment</div>
                            <div className="text-xs text-gray-600">Speed that beats demand</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-light text-emerald-700 mb-1">550+</div>
                            <div className="text-sm font-medium text-gray-900">Network Partners</div>
                            <div className="text-xs text-gray-600">Largest liquor ecosystem</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/marketing/placeholder.svg?height=400&width=800')] opacity-10"></div>
                <div className="container relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <Crown className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
                        <h2 className="text-3xl font-light mb-2">Ready to Command Your Market?</h2>
                        <p className="text-xl text-emerald-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Join the exclusive circle of brand owners who've transformed their distribution networks with Promco. This
                            isn't just software — it's your competitive advantage.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                className="bg-white text-emerald-900 hover:bg-gray-100 px-8 h-14 text-lg shadow-lg"
                                asChild>
                                <Link href="/for-brands/request-access">
                                    Request Access
                                    <Crown className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="text-emerald-700 dark:text-emerald-100 border-emerald-400 dark:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 px-8 h-14 text-lg"
                                asChild>
                                <Link href="/for-brands/demo">
                                    Schedule Demo
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>

                        <p className="text-emerald-200 text-sm mt-2">
                            * VIP access includes dedicated account management and priority support
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

function CompactFeatureCard({
    icon: Icon,
    title,
    description,
    color,
}: {
    icon: React.ElementType
    title: string
    description: string
    color: "emerald" | "teal"
}) {
    const bgColor = color === "emerald" ? "bg-emerald-50" : "bg-teal-50"
    const textColor = color === "emerald" ? "text-emerald-700" : "text-teal-700"

    return (
        <motion.div variants={fadeInUp} className="mx-auto">
            <Card className="p-1 border-gray-200 hover:shadow-md transition-all duration-300 hover:border-emerald-200 group h-full">
                <CardContent className="p-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className={`${bgColor} w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                            <Icon className={`h-4 w-4 ${textColor}`} />
                        </div>
                        <h3 className="text-base font-medium text-gray-900">{title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </CardContent>
            </Card>
        </motion.div>
    )
}