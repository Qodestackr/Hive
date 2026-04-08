"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Textarea } from "@repo/ui/components/textarea"
import { Checkbox } from "@repo/ui/components/checkbox"
import { cn } from "@repo/ui/lib/utils"
import type { CampaignState, Segment, AIOfferOption } from "../campaign-launcher"
import {
    Users,
    Crown,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Check,
    MessageSquare,
    ArrowRight,
    ArrowLeft,
    ThumbsUp,
    ThumbsDown,
    Loader2,
} from "lucide-react"

interface Props {
    campaign: CampaignState
    updateCampaign: (updates: Partial<CampaignState>) => void
    onNext: () => void
    onBack: () => void
}

// Mock segments from customer database
const MOCK_SEGMENTS: Segment[] = [
    { id: "all", name: "All Customers", count: 2847, description: "Everyone opted-in", avgSpend: 3200, icon: "users" },
    { id: "gold", name: "Gold Tier", count: 342, description: "Top 12% spenders", avgSpend: 12500, icon: "crown" },
    {
        id: "whiskey-lovers",
        name: "Whiskey Buyers",
        count: 891,
        description: "Bought whiskey last 90 days",
        avgSpend: 5400,
        icon: "glass",
    },
    {
        id: "dormant",
        name: "Dormant (30d+)",
        count: 456,
        description: "No orders in 30+ days",
        avgSpend: 2100,
        icon: "sleep",
    },
    { id: "nairobi", name: "Nairobi Metro", count: 1234, description: "Within 15km of CBD", avgSpend: 4100, icon: "map" },
]

function generateAIOffers(campaign: CampaignState, segment: Segment | null): AIOfferOption[] {
    // Mock AI-generated offers based on FIFO cost + segment behavior
    const avgProductCost =
        campaign.products.reduce((sum, p) => sum + (p.currentFIFOCost || p.basePrice * 0.7), 0) / campaign.products.length
    const avgProductPrice = campaign.products.reduce((sum, p) => sum + p.basePrice, 0) / campaign.products.length
    const baseMargin = ((avgProductPrice - avgProductCost) / avgProductPrice) * 100
    const segmentMultiplier = segment?.id === "gold" ? 1.2 : segment?.id === "dormant" ? 0.8 : 1

    return [
        {
            id: "conservative",
            offerType: "percentage_discount",
            offerValue: 10,
            projectedMargin: baseMargin - 10,
            projectedRedemptions: Math.round((segment?.count || 500) * 0.12 * segmentMultiplier),
            projectedProfit: Math.round(
                (segment?.count || 500) * 0.12 * segmentMultiplier * (avgProductPrice * 0.9 - avgProductCost),
            ),
            aiConfidence: 92,
            reasoning:
                "Conservative approach. Protects margin while still driving traffic. Best for Gold tier who convert anyway.",
            risk: "low",
        },
        {
            id: "balanced",
            offerType: "percentage_discount",
            offerValue: 15,
            projectedMargin: baseMargin - 15,
            projectedRedemptions: Math.round((segment?.count || 500) * 0.18 * segmentMultiplier),
            projectedProfit: Math.round(
                (segment?.count || 500) * 0.18 * segmentMultiplier * (avgProductPrice * 0.85 - avgProductCost),
            ),
            aiConfidence: 87,
            reasoning:
                "Sweet spot for most segments. 50% more redemptions than 10% off, profit impact manageable with your current FIFO costs.",
            risk: "medium",
        },
        {
            id: "aggressive",
            offerType: "percentage_discount",
            offerValue: 20,
            projectedMargin: baseMargin - 20,
            projectedRedemptions: Math.round((segment?.count || 500) * 0.25 * segmentMultiplier),
            projectedProfit: Math.round(
                (segment?.count || 500) * 0.25 * segmentMultiplier * (avgProductPrice * 0.8 - avgProductCost),
            ),
            aiConfidence: 74,
            reasoning:
                "High volume play. ⚠️ Only profitable if current FIFO batch costs hold. Watch Hennessy—margin gets tight at 20% off.",
            risk: "high",
        },
    ]
}

export function SegmentOfferStep({ campaign, updateCampaign, onNext, onBack }: Props) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiOffers, setAiOffers] = useState<AIOfferOption[]>([])
    const [feedback, setFeedback] = useState<Record<string, "up" | "down" | null>>({})

    // Generate AI offers when segment changes
    useEffect(() => {
        if (campaign.segment) {
            setIsGenerating(true)
            // Simulate AI processing
            setTimeout(() => {
                setAiOffers(generateAIOffers(campaign, campaign.segment))
                setIsGenerating(false)
            }, 800)
        }
    }, [campaign]) // Fixed dependency array - need full campaign object since generateAIOffers uses campaign.products

    const segmentIcon = (icon: string) => {
        switch (icon) {
            case "crown":
                return Crown
            default:
                return Users
        }
    }

    const canProceed = campaign.segment && campaign.selectedOffer && campaign.messageTemplate

    const getMessagePreview = () => {
        const productName = campaign.products[0]?.name.split(" ")[0] || "product"
        const discount = campaign.selectedOffer?.offerValue || 15
        return campaign.messageTemplate
            .replace("{{product}}", productName)
            .replace("{{discount}}", `${discount}%`)
            .replace("{{name}}", "John")
    }

    return (
        <div className="space-y-6">
            {/* Segment Selection */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Target Audience</CardTitle>
                    <CardDescription>Who should receive this campaign?</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {MOCK_SEGMENTS.map((segment) => {
                            const Icon = segmentIcon(segment.icon)
                            const isSelected = campaign.segment?.id === segment.id
                            return (
                                <button
                                    key={segment.id}
                                    onClick={() => updateCampaign({ segment, selectedOffer: null })}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                        isSelected
                                            ? "border-primary bg-primary/10 ring-2 ring-primary"
                                            : "border-border hover:border-primary/50",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-2 rounded-lg",
                                            isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-foreground">{segment.name}</p>
                                            <Badge variant="secondary" className="text-xs">
                                                {segment.count.toLocaleString()}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{segment.description}</p>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* AI Offer Options */}
            {campaign.segment && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">AI-Generated Offers</CardTitle>
                        </div>
                        <CardDescription>Based on FIFO costs, {campaign.segment.name} behavior & profit thresholds</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isGenerating ? (
                            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Analyzing profit scenarios...</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {aiOffers.map((offer) => {
                                    const isSelected = campaign.selectedOffer?.id === offer.id
                                    const RiskIcon = offer.risk === "high" ? AlertTriangle : offer.risk === "medium" ? TrendingUp : Check
                                    return (
                                        <button
                                            key={offer.id}
                                            onClick={() => updateCampaign({ selectedOffer: offer })}
                                            className={cn(
                                                "w-full text-left p-4 rounded-xl border transition-all",
                                                isSelected
                                                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                                                    : "border-border bg-card hover:border-primary/50",
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-2xl font-bold text-foreground">{offer.offerValue}% OFF</span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-xs",
                                                                offer.risk === "low" && "border-emerald-500/50 text-emerald-600 bg-emerald-500/10",
                                                                offer.risk === "medium" && "border-amber-500/50 text-amber-600 bg-amber-500/10",
                                                                offer.risk === "high" && "border-destructive/50 text-destructive bg-destructive/10",
                                                            )}
                                                        >
                                                            <RiskIcon className="h-3 w-3 mr-1" />
                                                            {offer.risk} risk
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs ml-auto">
                                                            {offer.aiConfidence}% confidence
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Est. Redemptions</p>
                                                            <p className="font-semibold text-foreground">{offer.projectedRedemptions}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Margin After</p>
                                                            <p
                                                                className={cn(
                                                                    "font-semibold",
                                                                    offer.projectedMargin >= 15
                                                                        ? "text-emerald-600"
                                                                        : offer.projectedMargin >= 10
                                                                            ? "text-amber-600"
                                                                            : "text-destructive",
                                                                )}
                                                            >
                                                                {offer.projectedMargin.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Projected Profit</p>
                                                            <p className="font-semibold text-emerald-600">
                                                                KES {offer.projectedProfit.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{offer.reasoning}</p>
                                                </div>
                                                {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
                                            </div>

                                            {/* Feedback buttons for reinforcement learning */}
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                                                <span className="text-xs text-muted-foreground">Was this helpful?</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "h-7 px-2",
                                                        feedback[offer.id] === "up" && "text-emerald-600 bg-emerald-500/10",
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setFeedback((f) => ({ ...f, [offer.id]: "up" }))
                                                    }}
                                                >
                                                    <ThumbsUp className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "h-7 px-2",
                                                        feedback[offer.id] === "down" && "text-destructive bg-destructive/10",
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setFeedback((f) => ({ ...f, [offer.id]: "down" }))
                                                    }}
                                                >
                                                    <ThumbsDown className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Message Template */}
            {campaign.selectedOffer && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Campaign Message</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Hey {{name}}! 🎉 Get {{discount}} off {{product}} this weekend only. Use code: FLASH2024"
                            value={campaign.messageTemplate}
                            onChange={(e) => updateCampaign({ messageTemplate: e.target.value })}
                            rows={3}
                        />
                        {campaign.messageTemplate && (
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                                <p className="text-sm text-foreground">{getMessagePreview()}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={campaign.platforms.includes("whatsapp")}
                                    onCheckedChange={(checked) => {
                                        const platforms = checked
                                            ? [...campaign.platforms, "whatsapp" as const]
                                            : campaign.platforms.filter((p) => p !== "whatsapp")
                                        updateCampaign({ platforms })
                                    }}
                                />
                                WhatsApp
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={campaign.platforms.includes("sms")}
                                    onCheckedChange={(checked) => {
                                        const platforms = checked
                                            ? [...campaign.platforms, "sms" as const]
                                            : campaign.platforms.filter((p) => p !== "sms")
                                        updateCampaign({ platforms })
                                    }}
                                />
                                SMS
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={campaign.platforms.includes("email")}
                                    onCheckedChange={(checked) => {
                                        const platforms = checked
                                            ? [...campaign.platforms, "email" as const]
                                            : campaign.platforms.filter((p) => p !== "email")
                                        updateCampaign({ platforms })
                                    }}
                                />
                                Email
                            </label>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button size="lg" onClick={onNext} disabled={!canProceed} className="gap-2">
                    Review & Launch
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
