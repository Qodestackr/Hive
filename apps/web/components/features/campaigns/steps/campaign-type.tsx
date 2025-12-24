"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Badge } from "@repo/ui/components/badge"
import { cn } from "@/lib/utils"
import type { CampaignState, CampaignType, Product } from "../campaign-launcher"
import {
    Zap,
    Heart,
    Bell,
    Calendar,
    Moon,
    Megaphone,
    UserPlus,
    Check,
    Sparkles,
    TrendingUp,
    Package,
    Search,
    ArrowRight,
} from "lucide-react"

interface Props {
    campaign: CampaignState
    updateCampaign: (updates: Partial<CampaignState>) => void
    onNext: () => void
}

const CAMPAIGN_TYPES: { type: CampaignType; label: string; description: string; icon: typeof Zap; color: string }[] = [
    {
        type: "flash_sale",
        label: "Flash Sale",
        description: "Time-limited discounts",
        icon: Zap,
        color: "text-amber-500",
    },
    {
        type: "loyalty_nudge",
        label: "Loyalty Nudge",
        description: "Reward top customers",
        icon: Heart,
        color: "text-rose-500",
    },
    {
        type: "restock_alert",
        label: "Restock Alert",
        description: "Notify when back in stock",
        icon: Bell,
        color: "text-blue-500",
    },
    {
        type: "event_promo",
        label: "Event Promo",
        description: "Black Friday, holidays",
        icon: Calendar,
        color: "text-purple-500",
    },
    {
        type: "dead_hour_boost",
        label: "Dead Hour Boost",
        description: "Off-peak incentives",
        icon: Moon,
        color: "text-indigo-500",
    },
    {
        type: "product_launch",
        label: "Product Launch",
        description: "New product intro",
        icon: Megaphone,
        color: "text-emerald-500",
    },
    {
        type: "reactivation",
        label: "Win Back",
        description: "Re-engage dormant buyers",
        icon: UserPlus,
        color: "text-cyan-500",
    },
]

// Mock products from Saleor + FIFO cost data
const MOCK_PRODUCTS: Product[] = [
    {
        id: "1",
        name: "Jameson Irish Whiskey 750ml",
        sku: "JAM-750",
        basePrice: 3200,
        currentFIFOCost: 2300,
        currentStockQuantity: 45,
        avgMarginPercent: 28,
        category: "Whiskey",
        image: "/jameson-whiskey-bottle.jpg",
    },
    {
        id: "2",
        name: "Hennessy VS 750ml",
        sku: "HEN-VS-750",
        basePrice: 10500,
        currentFIFOCost: 8200,
        currentStockQuantity: 12,
        avgMarginPercent: 22,
        category: "Cognac",
        image: "/hennessy-cognac-bottle.jpg",
    },
    {
        id: "3",
        name: "Four Cousins Sweet Red 1.5L",
        sku: "FC-RED-1500",
        basePrice: 1200,
        currentFIFOCost: 780,
        currentStockQuantity: 120,
        avgMarginPercent: 35,
        category: "Wine",
        image: "/red-wine-bottle.png",
    },
    {
        id: "4",
        name: "Tusker Lager 500ml (24pk)",
        sku: "TUSK-24PK",
        basePrice: 2800,
        currentFIFOCost: 2100,
        currentStockQuantity: 85,
        avgMarginPercent: 25,
        category: "Beer",
        image: "/tusker-beer-pack.jpg",
    },
    {
        id: "5",
        name: "Smirnoff Vodka 1L",
        sku: "SMR-1000",
        basePrice: 1800,
        currentFIFOCost: 1350,
        currentStockQuantity: 38,
        avgMarginPercent: 25,
        category: "Vodka",
        image: "/smirnoff-vodka-bottle.jpg",
    },
]

// AI suggestions based on supplier promos, seasonality, etc.
const AI_SUGGESTIONS = [
    {
        id: "supplier-promo",
        type: "flash_sale" as CampaignType,
        title: "Supplier Promo Detected",
        description: "Jameson wholesaler offering 8% volume discount this week. Pass savings to customers?",
        products: ["1"],
        confidence: 94,
        icon: TrendingUp,
        highlight: true,
    },
    {
        id: "black-friday",
        type: "event_promo" as CampaignType,
        title: "Black Friday in 12 days",
        description: "Your top-selling Hennessy & Jameson combo could drive 3x normal weekend traffic",
        products: ["1", "2"],
        confidence: 87,
        icon: Calendar,
        highlight: false,
    },
    {
        id: "slow-mover",
        type: "flash_sale" as CampaignType,
        title: "Clear Slow Inventory",
        description: "Four Cousins hasn't moved in 18 days. 15% discount still profitable at current FIFO cost.",
        products: ["3"],
        confidence: 82,
        icon: Package,
        highlight: false,
    },
]

export function CampaignTypeStep({ campaign, updateCampaign, onNext }: Props) {
    const [searchQuery, setSearchQuery] = useState("")
    const [showAllTypes, setShowAllTypes] = useState(false)

    const filteredProducts = MOCK_PRODUCTS.filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const toggleProduct = (product: Product) => {
        const isSelected = campaign.products.some((p) => p.id === product.id)
        if (isSelected) {
            updateCampaign({ products: campaign.products.filter((p) => p.id !== product.id) })
        } else {
            updateCampaign({ products: [...campaign.products, product] })
        }
    }

    const selectSuggestion = (suggestion: (typeof AI_SUGGESTIONS)[0]) => {
        const products = MOCK_PRODUCTS.filter((p) => suggestion.products.includes(p.id))
        updateCampaign({
            type: suggestion.type,
            products,
            name: suggestion.title,
        })
    }

    const canProceed = campaign.type && campaign.products.length > 0

    return (
        <div className="space-y-6">
            {/* AI Suggestions */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">AI Recommendations</CardTitle>
                    </div>
                    <CardDescription>Based on supplier promos, inventory velocity & upcoming events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {AI_SUGGESTIONS.map((suggestion) => {
                        const Icon = suggestion.icon
                        const isSelected = campaign.name === suggestion.title
                        return (
                            <button
                                key={suggestion.id}
                                onClick={() => selectSuggestion(suggestion)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border transition-all",
                                    isSelected
                                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                                        : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
                                    suggestion.highlight && !isSelected && "border-amber-500/50 bg-amber-500/5",
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            "p-2 rounded-lg",
                                            suggestion.highlight ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
                                            {suggestion.highlight && (
                                                <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 text-xs">
                                                    Hot
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs ml-auto">
                                                {suggestion.confidence}% match
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                                    </div>
                                    {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
                                </div>
                            </button>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Manual Campaign Type Selection */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Or choose campaign type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {(showAllTypes ? CAMPAIGN_TYPES : CAMPAIGN_TYPES.slice(0, 4)).map((ct) => {
                            const Icon = ct.icon
                            const isSelected = campaign.type === ct.type
                            return (
                                <button
                                    key={ct.type}
                                    onClick={() => updateCampaign({ type: ct.type })}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                                        isSelected
                                            ? "border-primary bg-primary/10 ring-2 ring-primary"
                                            : "border-border bg-card hover:border-primary/50",
                                    )}
                                >
                                    <Icon className={cn("h-6 w-6", ct.color)} />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{ct.label}</p>
                                        <p className="text-xs text-muted-foreground hidden sm:block">{ct.description}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                    {!showAllTypes && (
                        <Button variant="ghost" size="sm" onClick={() => setShowAllTypes(true)} className="mt-2 w-full">
                            Show all types
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Select Products</CardTitle>
                    <CardDescription>Choose products for this campaign (from Saleor catalog)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {filteredProducts.map((product) => {
                            const isSelected = campaign.products.some((p) => p.id === product.id)
                            const margin = product.avgMarginPercent ?? 0
                            return (
                                <button
                                    key={product.id}
                                    onClick={() => toggleProduct(product)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                                    )}
                                >
                                    <img
                                        src={product.image || "/placeholder.svg"}
                                        alt={product.name}
                                        className="h-12 w-12 rounded-lg object-cover bg-muted"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">{product.name}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span>KES {product.basePrice.toLocaleString()}</span>
                                            <span>•</span>
                                            <span>{product.currentStockQuantity} in stock</span>
                                            <span>•</span>
                                            <span
                                                className={cn(
                                                    margin >= 25 ? "text-emerald-600" : margin >= 15 ? "text-amber-600" : "text-destructive",
                                                )}
                                            >
                                                {margin}% margin
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                            isSelected ? "border-primary bg-primary" : "border-muted-foreground",
                                        )}
                                    >
                                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {campaign.products.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                            <span className="text-sm text-muted-foreground">Selected:</span>
                            {campaign.products.map((p) => (
                                <Badge key={p.id} variant="secondary" className="gap-1">
                                    {p.name.split(" ")[0]}
                                    <button onClick={() => toggleProduct(p)} className="ml-1 hover:text-destructive">
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Campaign Name */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Campaign Name</label>
                        <Input
                            placeholder="e.g., Black Friday Whiskey Blowout"
                            value={campaign.name}
                            onChange={(e) => updateCampaign({ name: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Next Button */}
            <div className="flex justify-end">
                <Button size="lg" onClick={onNext} disabled={!canProceed} className="gap-2">
                    Continue to Targeting
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
