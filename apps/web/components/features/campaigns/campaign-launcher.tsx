"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CampaignTypeStep } from "./steps/campaign-type"
import { PreflightLaunchStep } from "./steps/preflight-launch-step"
import { SegmentOfferStep } from "./steps/segment-offer-step"
import { cn } from "@/lib/utils"
import { Rocket, Target, Zap } from "lucide-react"

export type CampaignType =
    | "flash_sale"
    | "loyalty_nudge"
    | "restock_alert"
    | "event_promo"
    | "dead_hour_boost"
    | "product_launch"
    | "reactivation"
export type OfferType = "percentage_discount" | "fixed_discount" | "buy_x_get_y" | "free_delivery"

export interface Product {
    id: string
    name: string
    sku: string
    basePrice: number
    currentFIFOCost: number | null
    currentStockQuantity: number
    avgMarginPercent: number | null
    category: string
    image?: string
}

export interface Segment {
    id: string
    name: string
    count: number
    description: string
    avgSpend: number
    icon: string
}

export interface AIOfferOption {
    id: string
    offerType: OfferType
    offerValue: number
    minPurchaseAmount?: number
    projectedMargin: number
    projectedRedemptions: number
    projectedProfit: number
    aiConfidence: number
    reasoning: string
    risk: "low" | "medium" | "high"
}

export interface CampaignState {
    // Step 1
    type: CampaignType | null
    name: string
    products: Product[]
    // Step 2
    segment: Segment | null
    selectedOffer: AIOfferOption | null
    messageTemplate: string
    platforms: ("whatsapp" | "sms" | "email")[]
    // Step 3 (computed)
    estimatedFIFOCost: number
    estimatedProfitPerRedemption: number
    projectedTotalProfit: number
}

const STEP_CONFIG = [
    { label: "Campaign", icon: Zap, description: "Type & Products" },
    { label: "Segment", icon: Target, description: "Audience & Offer" },
    { label: "Launch", icon: Rocket, description: "Review & Go" },
]

export function CampaignLauncher() {
    const [step, setStep] = useState(1)
    const [campaign, setCampaign] = useState<CampaignState>({
        type: null,
        name: "",
        products: [],
        segment: null,
        selectedOffer: null,
        messageTemplate: "",
        platforms: ["whatsapp"],
        estimatedFIFOCost: 0,
        estimatedProfitPerRedemption: 0,
        projectedTotalProfit: 0,
    })

    const updateCampaign = (updates: Partial<CampaignState>) => {
        setCampaign((prev) => ({ ...prev, ...updates }))
    }

    const nextStep = () => setStep((s) => Math.min(s + 1, 3))
    const prevStep = () => setStep((s) => Math.max(s - 1, 1))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Launch Campaign</h1>
                <p className="text-muted-foreground">AI-powered profit-protected promotions</p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2">
                {STEP_CONFIG.map((s, i) => {
                    const Icon = s.icon
                    const isActive = step === i + 1
                    const isComplete = step > i + 1
                    return (
                        <div key={i} className="flex items-center">
                            <button
                                onClick={() => step > i + 1 && setStep(i + 1)}
                                disabled={step <= i + 1}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                                    isActive && "bg-primary text-primary-foreground shadow-lg",
                                    isComplete && "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30",
                                    !isActive && !isComplete && "bg-muted text-muted-foreground",
                                )}
                            >
                                <Icon className={cn("h-4 w-4", isComplete && "text-primary")} />
                                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                            </button>
                            {i < 2 && <div className={cn("w-8 h-0.5 mx-1", step > i + 1 ? "bg-primary" : "bg-muted")} />}
                        </div>
                    )
                })}
            </div>

            {/* Step Content */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CampaignTypeStep campaign={campaign} updateCampaign={updateCampaign} onNext={nextStep} />
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SegmentOfferStep
                                campaign={campaign}
                                updateCampaign={updateCampaign}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PreflightLaunchStep campaign={campaign} updateCampaign={updateCampaign} onBack={prevStep} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
