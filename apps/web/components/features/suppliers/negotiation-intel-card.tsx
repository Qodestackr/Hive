"use client"
import { Card, CardContent, CardFooter, CardHeader } from "@repo/ui/src/components/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@repo/ui/src/components/collapsible"
import { Separator } from "@repo/ui/src/components/separator"
import { cn } from "@repo/ui/src/lib/utils"
import { ChevronDown, Sparkles, TrendingUp, Target, MessageSquare } from "lucide-react"
import { useState } from "react"

interface NegotiationIntelProps {
    productName?: string
    performance?: {
        volume: number
        revenue: number
        redemptionRate: number
        nationalPercentile: number
        periodDays: number
    }
    currentSupplierPrice?: number
    suggestedNegotiation?: {
        targetPrice: number
        discountPercentage: number
        reasoning: string
    }
    fallbackPosition?: string
    negotiationScript?: string
}

export function NegotiationIntelCard({
    productName = "Hennessy VS 750ml",
    performance = {
        volume: 495,
        revenue: 4200000,
        redemptionRate: 78,
        nationalPercentile: 5,
        periodDays: 90,
    },
    currentSupplierPrice = 8500,
    suggestedNegotiation = {
        targetPrice: 8200,
        discountPercentage: 3.5,
        reasoning:
            "Your 78% redemption rate places you in the Top 5% nationally. Suppliers pay premium for guaranteed shelf placement with high-performing distributors.",
    },
    fallbackPosition = "If they decline the price discount, request co-op funding (KES 50-100 per case) for promotional campaigns instead. This comes from their marketing budget, not pricing.",
    negotiationScript = `"We moved 495 bottles of Hennessy VS last quarter with a 78% promo redemption rate. That's Top 5% performance nationally.\n\nFor guaranteed shelf placement next quarter and continued strong sell-through, we need pricing that protects our 20% target margin. We're requesting KES 8,200/bottle—a 3.5% volume discount.\n\nThis benefits both of us: you get priority placement with a proven high-performer, and we maintain sustainable margins that allow us to push your brand aggressively."`,
}: Partial<NegotiationIntelProps>) {
    const [openScript, setOpenScript] = useState(false)
    const [openFallback, setOpenFallback] = useState(false)

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)

    const performanceClass =
        performance.nationalPercentile <= 10
            ? "text-emerald-600 dark:text-emerald-400"
            : performance.nationalPercentile <= 25
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-600 dark:text-zinc-400"

    return (
        <Card className="w-full max-w-2xl border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/30 dark:to-purple-950/30">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Negotiation Intel
                        </p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{productName}</h2>
                    </div>
                    <div className="rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <Target className="h-5 w-5" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/30">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        <TrendingUp className="h-4 w-4" />
                        <span>Your Performance (Last {performance.periodDays} Days)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Volume Moved</p>
                            <p className="font-semibold text-emerald-900 dark:text-emerald-100">{performance.volume} bottles</p>
                        </div>
                        <div>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Revenue</p>
                            <p className="font-semibold text-emerald-900 dark:text-emerald-100">{formatMoney(performance.revenue)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Redemption Rate</p>
                            <p className="font-semibold text-emerald-900 dark:text-emerald-100">{performance.redemptionRate}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">National Rank</p>
                            <p className={cn("font-bold", performanceClass)}>Top {performance.nationalPercentile}% 🔥</p>
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Current Supplier Price</p>
                            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                                {formatMoney(currentSupplierPrice)}/bottle
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Suggested Target</p>
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {formatMoney(suggestedNegotiation.targetPrice)}/bottle
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                ({suggestedNegotiation.discountPercentage}% discount)
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">Why this works:</p>
                        <p className="mt-1 text-xs leading-relaxed">{suggestedNegotiation.reasoning}</p>
                    </div>
                </div>
                <Separator />
                <Collapsible open={openScript} onOpenChange={setOpenScript}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 hover:bg-indigo-50 dark:border-indigo-900/30 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50">
                        <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                            <Sparkles className="h-4 w-4" />
                            <span>AI-Generated Negotiation Script</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-indigo-500 transition-transform", openScript && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                            <div className="mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-zinc-500" />
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Copy this script for your supplier call/meeting:
                                </p>
                            </div>
                            <div className="whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                {negotiationScript}
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                <Collapsible open={openFallback} onOpenChange={setOpenFallback}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 hover:bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/30 dark:hover:bg-amber-950/50">
                        <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            Fallback Position (if declined)
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-amber-500 transition-transform", openFallback && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                        <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm leading-relaxed text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                            {fallbackPosition}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
            <CardFooter className="bg-zinc-50/50 p-3 dark:bg-zinc-900/50">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    💡 Powered by Promco's real-time redemption data. This intel is based on actual performance across all
                    distributors in your region.
                </p>
            </CardFooter>
        </Card>
    )
}
