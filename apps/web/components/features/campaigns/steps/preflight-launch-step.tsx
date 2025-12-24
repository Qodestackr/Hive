"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Button } from "@repo/ui/components/button"
import { Switch } from "@repo/ui/components/switch"
import { Separator } from "@repo/ui/components/separator"
import { cn } from "@repo/ui/lib/utils"
import type { CampaignState } from "../campaign-launcher"
import {
    Shield,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    ArrowLeft,
    Rocket,
    Package,
    Users,
    DollarSign,
    Clock,
    Zap,
    Loader2,
    PartyPopper,
} from "lucide-react"

interface Props {
    campaign: CampaignState
    updateCampaign: (updates: Partial<CampaignState>) => void
    onBack: () => void
}

interface PreflightCheck {
    id: string
    label: string
    status: "pass" | "warning" | "fail"
    message: string
    icon: typeof Shield
}

function runPreflightChecks(campaign: CampaignState): PreflightCheck[] {
    const checks: PreflightCheck[] = []

    // Check 1: Stock availability
    const totalStock = campaign.products.reduce((sum, p) => sum + p.currentStockQuantity, 0)
    const estimatedRedemptions = campaign.selectedOffer?.projectedRedemptions || 0
    const stockCoverage = (totalStock / estimatedRedemptions) * 100

    checks.push({
        id: "stock",
        label: "Stock Coverage",
        status: stockCoverage >= 150 ? "pass" : stockCoverage >= 100 ? "warning" : "fail",
        message:
            stockCoverage >= 150
                ? `${totalStock} units available (${stockCoverage.toFixed(0)}% of projected demand)`
                : stockCoverage >= 100
                    ? `Tight stock—${totalStock} units may just cover demand. Consider restock.`
                    : `⚠️ Only ${totalStock} units. Expected ${estimatedRedemptions} redemptions!`,
        icon: Package,
    })

    // Check 2: Profit margin check
    const avgCost =
        campaign.products.reduce((sum, p) => sum + (p.currentFIFOCost || p.basePrice * 0.7), 0) / campaign.products.length
    const avgPrice = campaign.products.reduce((sum, p) => sum + p.basePrice, 0) / campaign.products.length
    const discountPercent = campaign.selectedOffer?.offerValue || 0
    const discountedPrice = avgPrice * (1 - discountPercent / 100)
    const marginAfterDiscount = ((discountedPrice - avgCost) / discountedPrice) * 100

    checks.push({
        id: "margin",
        label: "Profit Protection",
        status: marginAfterDiscount >= 15 ? "pass" : marginAfterDiscount >= 8 ? "warning" : "fail",
        message:
            marginAfterDiscount >= 15
                ? `Healthy ${marginAfterDiscount.toFixed(1)}% margin after ${discountPercent}% discount`
                : marginAfterDiscount >= 8
                    ? `Thin margin (${marginAfterDiscount.toFixed(1)}%). Auto-pause will trigger if costs rise.`
                    : `🚨 LOSS ALERT: ${marginAfterDiscount.toFixed(1)}% margin. You'll lose money on each sale!`,
        icon: Shield,
    })

    // Check 3: FIFO cost freshness
    const hasStaleCosting = campaign.products.some((p) => !p.currentFIFOCost)
    checks.push({
        id: "fifo",
        label: "Cost Data Quality",
        status: hasStaleCosting ? "warning" : "pass",
        message: hasStaleCosting
            ? "Some products missing FIFO cost. Using estimated costs (70% of price)."
            : "All products have verified FIFO batch costs",
        icon: TrendingUp,
    })

    // Check 4: Audience reach
    const audienceSize = campaign.segment?.count || 0
    checks.push({
        id: "audience",
        label: "Audience Reach",
        status: audienceSize >= 100 ? "pass" : audienceSize >= 20 ? "warning" : "fail",
        message: `${audienceSize.toLocaleString()} verified customers will receive this campaign`,
        icon: Users,
    })

    return checks
}

export function PreflightLaunchStep({ campaign, updateCampaign, onBack }: Props) {
    const [autoPause, setAutoPause] = useState(true)
    const [pauseThreshold, setPauseThreshold] = useState(10)
    const [isLaunching, setIsLaunching] = useState(false)
    const [launched, setLaunched] = useState(false)

    const checks = runPreflightChecks(campaign)
    const hasFailures = checks.some((c) => c.status === "fail")
    const hasWarnings = checks.some((c) => c.status === "warning")

    const handleLaunch = async () => {
        setIsLaunching(true)
        // Simulate API call to create campaign
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setIsLaunching(false)
        setLaunched(true)
    }

    if (launched) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <PartyPopper className="h-12 w-12 text-emerald-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Campaign Launched! 🚀</h2>
                    <p className="text-muted-foreground max-w-md">
                        "{campaign.name}" is now live. {campaign.segment?.count.toLocaleString()} customers will receive your{" "}
                        {campaign.selectedOffer?.offerValue}% off offer via {campaign.platforms.join(", ")}.
                    </p>
                </div>

                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-foreground">{campaign.selectedOffer?.projectedRedemptions}</p>
                                <p className="text-xs text-muted-foreground">Est. Redemptions</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-600">
                                    KES {campaign.selectedOffer?.projectedProfit.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">Projected Profit</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button variant="outline">View Dashboard</Button>
                    <Button onClick={() => window.location.reload()}>Create Another</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Pre-flight Summary */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <Zap className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                            <p className="text-lg font-bold text-foreground">{campaign.selectedOffer?.offerValue}%</p>
                            <p className="text-xs text-muted-foreground">Discount</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <Users className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                            <p className="text-lg font-bold text-foreground">{campaign.segment?.count.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Recipients</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <Package className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                            <p className="text-lg font-bold text-foreground">{campaign.products.length}</p>
                            <p className="text-xs text-muted-foreground">Products</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <DollarSign className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                            <p className="text-lg font-bold text-emerald-600">
                                {campaign.selectedOffer?.projectedProfit.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Est. Profit</p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Campaign</span>
                            <span className="font-medium text-foreground">{campaign.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target</span>
                            <span className="font-medium text-foreground">{campaign.segment?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Channels</span>
                            <span className="font-medium text-foreground capitalize">{campaign.platforms.join(", ")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Products</span>
                            <span className="font-medium text-foreground truncate max-w-[200px]">
                                {campaign.products.map((p) => p.name.split(" ")[0]).join(", ")}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pre-flight Checks */}
            <Card
                className={cn(
                    "border-2",
                    hasFailures
                        ? "border-destructive/50 bg-destructive/5"
                        : hasWarnings
                            ? "border-amber-500/50 bg-amber-500/5"
                            : "border-emerald-500/50 bg-emerald-500/5",
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Shield
                            className={cn(
                                "h-5 w-5",
                                hasFailures ? "text-destructive" : hasWarnings ? "text-amber-500" : "text-emerald-600",
                            )}
                        />
                        <CardTitle className="text-lg">Pre-flight Profit Check</CardTitle>
                    </div>
                    <CardDescription>
                        {hasFailures
                            ? "🚨 Critical issues found. Fix before launching."
                            : hasWarnings
                                ? "⚠️ Proceed with caution—review warnings below."
                                : "✅ All systems go. Campaign is profit-protected."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {checks.map((check) => {
                        const Icon = check.icon
                        return (
                            <div
                                key={check.id}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border",
                                    check.status === "pass" && "bg-emerald-500/10 border-emerald-500/30",
                                    check.status === "warning" && "bg-amber-500/10 border-amber-500/30",
                                    check.status === "fail" && "bg-destructive/10 border-destructive/30",
                                )}
                            >
                                <div
                                    className={cn(
                                        "p-1.5 rounded-full",
                                        check.status === "pass" && "bg-emerald-500/20 text-emerald-600",
                                        check.status === "warning" && "bg-amber-500/20 text-amber-600",
                                        check.status === "fail" && "bg-destructive/20 text-destructive",
                                    )}
                                >
                                    {check.status === "pass" ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : check.status === "warning" ? (
                                        <AlertTriangle className="h-4 w-4" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground text-sm">{check.label}</p>
                                    <p className="text-sm text-muted-foreground">{check.message}</p>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Auto-Pause Settings */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Profit Protection</CardTitle>
                        </div>
                        <Switch checked={autoPause} onCheckedChange={setAutoPause} />
                    </div>
                    <CardDescription>Automatically pause campaign if profit margin drops below threshold</CardDescription>
                </CardHeader>
                {autoPause && (
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-muted-foreground whitespace-nowrap">Pause if margin falls below:</label>
                            <div className="flex items-center gap-2">
                                {[5, 10, 15, 20].map((val) => (
                                    <Button
                                        key={val}
                                        variant={pauseThreshold === val ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPauseThreshold(val)}
                                    >
                                        {val}%
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            We'll check every 5 minutes and send you an alert before pausing.
                        </p>
                    </CardContent>
                )}
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button
                    size="lg"
                    onClick={handleLaunch}
                    disabled={hasFailures || isLaunching}
                    className={cn("gap-2", !hasFailures && "bg-emerald-600 hover:bg-emerald-700")}
                >
                    {isLaunching ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Launching...
                        </>
                    ) : (
                        <>
                            <Rocket className="h-4 w-4" />
                            Launch Campaign
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
