"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Slider } from "@repo/ui/components/slider"

export function PromoCalculator() {
    const [productPrice, setProductPrice] = useState(10000)
    const [unitCost, setUnitCost] = useState(7500)
    const [discount, setDiscount] = useState(20)

    const netRevenue = productPrice * (1 - discount / 100)
    const profitPerUnit = netRevenue - unitCost
    const totalFor100 = profitPerUnit * 100
    const isProfitable = profitPerUnit > 0
    const profitMargin = ((profitPerUnit / netRevenue) * 100).toFixed(1)

    // Calculate suggested discount for breakeven + 10% margin
    const suggestedDiscount = Math.max(0, Math.min(100,
        ((productPrice - unitCost * 1.1) / productPrice) * 100
    ))

    const formatKES = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card className="border-none shadow-xl overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

                <CardHeader className="relative pb-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">Profit Calculator</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                See if your next promo makes or loses money
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative space-y-8 pb-8">
                    {/* Inputs Grid */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Product Price */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Product Price (KES)</Label>
                            <Input
                                type="number"
                                value={productPrice}
                                onChange={(e) => setProductPrice(Number(e.target.value))}
                                className="text-lg font-semibold h-12 rounded-xl border-2 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Unit Cost */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">FIFO Unit Cost (KES)</Label>
                            <Input
                                type="number"
                                value={unitCost}
                                onChange={(e) => setUnitCost(Number(e.target.value))}
                                className="text-lg font-semibold h-12 rounded-xl border-2 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Discount Percentage */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Discount (%)</Label>
                            <Input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                                className="text-lg font-semibold h-12 rounded-xl border-2 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    {/* Discount Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Adjust with slider</span>
                            <span className="text-sm font-semibold text-primary">{discount}% off</span>
                        </div>
                        <Slider
                            value={[discount]}
                            onValueChange={(value) => setDiscount(value[0] ?? 0)}
                            max={100}
                            step={1}
                            className="w-full"
                        />
                    </div>

                    {/* Results Section */}
                    <motion.div
                        key={isProfitable ? 'profit' : 'loss'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl p-6 border-2 ${isProfitable
                            ? 'bg-success/5 border-success/20'
                            : 'bg-error/5 border-error/20'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isProfitable ? 'bg-success/10' : 'bg-error/10'
                                }`}>
                                {isProfitable ? (
                                    <TrendingUp className="h-7 w-7 text-success" />
                                ) : (
                                    <TrendingDown className="h-7 w-7 text-error" />
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className={`text-xl font-bold ${isProfitable ? 'text-success' : 'text-error'
                                        }`}>
                                        {isProfitable ? '✓ This Promo is Profitable' : '⚠ This Promo Loses Money'}
                                    </h3>
                                    <p className="text-muted-foreground mt-1">
                                        {isProfitable
                                            ? 'You\'ll make money on every redemption'
                                            : 'You\'ll lose money on every redemption'}
                                    </p>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Net Revenue</div>
                                        <div className="text-lg font-bold">{formatKES(netRevenue)}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Profit/Unit</div>
                                        <div className={`text-lg font-bold ${isProfitable ? 'text-success' : 'text-error'
                                            }`}>
                                            {formatKES(profitPerUnit)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Margin</div>
                                        <div className="text-lg font-bold">{profitMargin}%</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">If 100 Sold</div>
                                        <div className={`text-lg font-bold ${isProfitable ? 'text-success' : 'text-error'
                                            }`}>
                                            {formatKES(totalFor100)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Suggestion */}
                    {!isProfitable && suggestedDiscount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-2xl bg-accent/10 border border-accent/20 p-5"
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                                <div className="space-y-2">
                                    <p className="font-semibold text-foreground">💡 Try This Instead</p>
                                    <p className="text-sm text-muted-foreground">
                                        Reduce to <span className="font-bold text-accent">{suggestedDiscount.toFixed(0)}% discount</span> to maintain a healthy 10% profit margin.
                                        This would give you <span className="font-bold text-success">{formatKES((productPrice * (1 - suggestedDiscount / 100) - unitCost) * 100)}</span> profit on 100 redemptions.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isProfitable && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-2xl bg-success/10 border border-success/20 p-5"
                        >
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-success">Ready to Launch</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        This promotion maintains healthy margins. With Promco, you'd get real-time alerts if profit starts dropping mid-campaign.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
