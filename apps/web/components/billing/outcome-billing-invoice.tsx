import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    Sparkles,
    TrendingUp,
    User,
} from "lucide-react"

import { Button } from "@repo/ui/components/button"
import {
    Card,
    CardContent,
    CardFooter,
} from "@repo/ui/components/card"
import {
    CollapsibleContent,
    Collapsible,
    CollapsibleTrigger,
} from "@repo/ui/components/collapsible"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/dialog"

import { Separator } from "@repo/ui/components/separator"
import { cn } from "@repo/ui/lib/utils"
import { useState } from "react"

interface CaptureDetail {
    customerPhone: string
    timestamp: string
    campaign: string
    verificationMethod: string
}

interface TransactionDetail {
    id: string
    timestamp: string
    bottlesSold: number
    fifoCost: number
    sellingPrice: number
    discountApplied: number
    profitPerUnit: number
}

interface CampaignProfit {
    name: string
    profit: number
    fee: number
    threshold?: boolean
    transactions?: TransactionDetail[]
}

interface BillingProps {
    invoiceAmount: number
    baseFee: number
    captures: {
        count: number
        rate: number
        total: number
        details?: CaptureDetail[]
    }
    campaigns: CampaignProfit[]
    totalValueCreated: number
    feePercentage: number
    netProfit: number
    currency?: string
    periodStart: string
    periodEnd: string
    aiInsight?: string
}

export function OutcomeBillingInvoice({
    invoiceAmount = 8200,
    baseFee = 2000,
    captures = {
        count: 23,
        rate: 100,
        total: 2300,
        details: [
            {
                customerPhone: "+254 7** *** 234",
                timestamp: "2024-01-15 14:23",
                campaign: "Jameson Flash Sale",
                verificationMethod: "ID Scan",
            },
            {
                customerPhone: "+254 7** *** 891",
                timestamp: "2024-01-15 16:45",
                campaign: "Jameson Flash Sale",
                verificationMethod: "Manual Entry",
            },
            {
                customerPhone: "+254 7** *** 567",
                timestamp: "2024-01-16 10:12",
                campaign: "Hennessy Weekend",
                verificationMethod: "ID Scan",
            },
        ],
    },
    campaigns = [
        {
            name: "Jameson Flash Sale",
            profit: 47000,
            fee: 2350,
            transactions: [
                {
                    id: "TXN-001",
                    timestamp: "2024-01-15 14:30",
                    bottlesSold: 12,
                    fifoCost: 1200,
                    sellingPrice: 1440,
                    discountApplied: 240,
                    profitPerUnit: 0,
                },
                {
                    id: "TXN-002",
                    timestamp: "2024-01-15 18:22",
                    bottlesSold: 8,
                    fifoCost: 1200,
                    sellingPrice: 1680,
                    discountApplied: 120,
                    profitPerUnit: 360,
                },
            ],
        },
        {
            name: "Hennessy Weekend",
            profit: 31000,
            fee: 1550,
            transactions: [
                {
                    id: "TXN-003",
                    timestamp: "2024-01-16 12:15",
                    bottlesSold: 5,
                    fifoCost: 9200,
                    sellingPrice: 10800,
                    discountApplied: 1200,
                    profitPerUnit: 400,
                },
            ],
        },
        { name: "Tusker Happy Hour", profit: 12000, fee: 0, threshold: true },
    ],
    totalValueCreated = 90000,
    feePercentage = 9.1,
    netProfit = 81800,
    currency = "KES",
    periodStart = "Jan 1, 2024",
    periodEnd = "Jan 31, 2024",
    aiInsight = "Strong month with Jameson and Hennessy driving 87% of profit. Tusker campaign hit threshold but didn't generate billable profit—consider adjusting discount depth or targeting higher-margin SKUs. 23 new verified customers captured, giving you expanded reach for February campaigns.",
}: Partial<BillingProps>) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

    const toggleSection = (key: string) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)

    return (
        <Card className="w-full max-w-lg overflow-hidden border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="bg-zinc-50/50 p-3 pb-2 dark:bg-zinc-900/50">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Invoice • {periodStart} - {periodEnd}
                        </p>
                        <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {formatMoney(invoiceAmount)}
                        </h2>
                    </div>
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>

                {aiInsight && (
                    <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-900/30 dark:bg-indigo-950/30">
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            <Sparkles className="h-3 w-3" />
                            <span>Period Insight</span>
                        </div>
                        <p className="text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-100/70">{aiInsight}</p>
                    </div>
                )}
            </div>

            <Separator />

            <CardContent className="space-y-5 my-1 p-2">
                <div className="space-y-4 text-sm">
                    {/* Base Fee */}
                    <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Platform access</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatMoney(baseFee)}</span>
                    </div>

                    {/* Captures */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Customer captures ({captures.count} verified)</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatMoney(captures.total)}</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            {captures.count} × {formatMoney(captures.rate)} per capture
                        </p>
                    </div>

                    {/* Profit Share */}
                    <div className="space-y-2">
                        <span className="text-zinc-600 dark:text-zinc-400">Profit share ({campaigns.length} campaigns)</span>
                        <ul className="space-y-2 pl-2">
                            {campaigns.map((campaign, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs">
                                    <div className="mt-1.5 h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-700 dark:text-zinc-300">{campaign.name}</span>
                                            <span
                                                className={cn(
                                                    "font-medium",
                                                    campaign.threshold ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-50",
                                                )}
                                            >
                                                {formatMoney(campaign.fee)}
                                            </span>
                                        </div>
                                        <div className="text-zinc-500 dark:text-zinc-500">
                                            {campaign.threshold ? (
                                                <span>(below threshold)</span>
                                            ) : (
                                                <span>
                                                    +{formatMoney(campaign.profit)} profit → {formatMoney(campaign.fee)} (5%)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900">
                    <div className="mb-1 flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total value created</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-50">{formatMoney(totalValueCreated)}</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400">Your fee</span>
                            <span className="text-zinc-900 dark:text-zinc-50">
                                {formatMoney(invoiceAmount)} ({feePercentage}% of value)
                            </span>
                        </div>
                        <div className="flex justify-between text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            <span>You keep</span>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>{formatMoney(netProfit)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="bg-zinc-50/50 p-2 dark:bg-zinc-900/50">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-between text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                            <span className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                View Detailed Breakdown
                            </span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Invoice Breakdown</DialogTitle>
                            <DialogDescription>
                                Complete audit trail for {periodStart} - {periodEnd}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2 py-2">
                            {/* Base Fee Details */}
                            <Collapsible open={openSections.base} onOpenChange={() => toggleSection("base")}>
                                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
                                                <CheckCircle2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-sm">Platform Access</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Monthly base fee</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{formatMoney(baseFee)}</span>
                                            <ChevronDown
                                                className={cn("h-4 w-4 transition-transform text-zinc-400", openSections.base && "rotate-180")}
                                            />
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="border-t border-zinc-200 bg-zinc-50/50 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                                            <p className="text-zinc-600 dark:text-zinc-400">
                                                Fixed monthly fee covering platform infrastructure, WhatsApp Business API costs, compliance
                                                monitoring, and customer support.
                                            </p>
                                            <div className="mt-1 space-y-1.5 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Infrastructure & hosting</span>
                                                    <span className="text-zinc-600 dark:text-zinc-400">Included</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">WhatsApp API access</span>
                                                    <span className="text-zinc-600 dark:text-zinc-400">Included</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Compliance & KRA eTIMS</span>
                                                    <span className="text-zinc-600 dark:text-zinc-400">Included</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>

                            {/* Captures Details */}
                            <Collapsible open={openSections.captures} onOpenChange={() => toggleSection("captures")}>
                                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-sm">Customer Captures</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{captures.count} verified customers</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{formatMoney(captures.total)}</span>
                                            <ChevronDown
                                                className={cn(
                                                    "h-4 w-4 transition-transform text-zinc-400",
                                                    openSections.captures && "rotate-180",
                                                )}
                                            />
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="border-t border-zinc-200 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                                            <div className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                                                Age-verified retail customers added to your database. Rate: {formatMoney(captures.rate)} per
                                                capture.
                                            </div>
                                            <div className="space-y-2">
                                                {captures.details?.slice(0, 3).map((detail, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between rounded border border-zinc-200 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                                    >
                                                        <div className="space-y-0.5">
                                                            <p className="font-mono font-medium text-zinc-900 dark:text-zinc-50">
                                                                {detail.customerPhone}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-zinc-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {detail.timestamp}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{detail.verificationMethod}</span>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-zinc-600 dark:text-zinc-400">
                                                            {formatMoney(captures.rate)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {captures.count > 3 && (
                                                    <p className="pt-1 text-center text-xs text-zinc-500">+ {captures.count - 3} more captures</p>
                                                )}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>

                            {/* Campaign Profit Share Details */}
                            {campaigns.map((campaign, idx) => (
                                <Collapsible
                                    key={idx}
                                    open={openSections[`campaign-${idx}`]}
                                    onOpenChange={() => toggleSection(`campaign-${idx}`)}
                                >
                                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "rounded-full p-1",
                                                        campaign.threshold
                                                            ? "bg-zinc-100 dark:bg-zinc-800"
                                                            : "bg-emerald-100 dark:bg-emerald-900/30",
                                                    )}
                                                >
                                                    <TrendingUp
                                                        className={cn(
                                                            "h-4 w-4",
                                                            campaign.threshold ? "text-zinc-400" : "text-emerald-600 dark:text-emerald-400",
                                                        )}
                                                    />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-sm">{campaign.name}</p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {campaign.threshold
                                                            ? "Below profit threshold"
                                                            : `+${formatMoney(campaign.profit)} profit generated`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("font-semibold", campaign.threshold && "text-zinc-400 dark:text-zinc-600")}>
                                                    {formatMoney(campaign.fee)}
                                                </span>
                                                {campaign.transactions && (
                                                    <ChevronDown
                                                        className={cn(
                                                            "h-4 w-4 transition-transform text-zinc-400",
                                                            openSections[`campaign-${idx}`] && "rotate-180",
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        </CollapsibleTrigger>
                                        {campaign.transactions && (
                                            <CollapsibleContent>
                                                <div className="border-t border-zinc-200 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                                                    <div className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                                                        5% profit share on campaign earnings. FIFO cost tracking ensures accurate profit
                                                        calculation.
                                                    </div>
                                                    <div className="space-y-2">
                                                        {campaign.transactions.map((txn, i) => (
                                                            <div
                                                                key={i}
                                                                className="rounded border border-zinc-200 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                                            >
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-50">
                                                                        {txn.id}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-zinc-500">
                                                                        <Clock className="h-3 w-3" />
                                                                        {txn.timestamp}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-zinc-600 dark:text-zinc-400">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-zinc-500">Bottles sold:</span>
                                                                        <span>{txn.bottlesSold}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-zinc-500">FIFO cost:</span>
                                                                        <span>{formatMoney(txn.fifoCost)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-zinc-500">Selling price:</span>
                                                                        <span>{formatMoney(txn.sellingPrice)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-zinc-500">Discount:</span>
                                                                        <span>-{formatMoney(txn.discountApplied)}</span>
                                                                    </div>
                                                                    <div className="col-span-2 mt-1 flex justify-between border-t border-zinc-200 pt-1.5 font-medium dark:border-zinc-700">
                                                                        <span className="text-zinc-700 dark:text-zinc-300">Profit/unit:</span>
                                                                        <span className="text-emerald-600 dark:text-emerald-400">
                                                                            +{formatMoney(txn.profitPerUnit)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </CollapsibleContent>
                                        )}
                                    </div>
                                </Collapsible>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    )
}