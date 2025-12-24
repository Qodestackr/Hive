"use client"

import { useState } from "react"
import { Card, CardContent } from "@repo/ui/components/card"
import { Label } from "@repo/ui/components/label"
import { Switch } from "@repo/ui/components/switch"
import { Slider } from "@repo/ui/components/slider"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Input } from "@repo/ui/components/input"
import { AlertTriangle, TrendingDown, Package, DollarSign, CheckCircle2, Info } from "lucide-react"

interface AutoPauseRule {
    id: string
    name: string
    description: string
    icon: "margin" | "stock" | "loss"
    enabled: boolean
    threshold: number
    unit: string
}

const DEFAULT_RULES: AutoPauseRule[] = [
    {
        id: "margin",
        name: "Margin collapse",
        description: "Pause when campaign margin drops below threshold",
        icon: "margin",
        enabled: true,
        threshold: 5,
        unit: "%",
    },
    {
        id: "stock",
        name: "Stock depletion",
        description: "Pause when promotional stock hits minimum",
        icon: "stock",
        enabled: true,
        threshold: 10,
        unit: "units",
    },
    {
        id: "loss",
        name: "Cumulative loss",
        description: "Pause when total campaign loss exceeds limit",
        icon: "loss",
        enabled: false,
        threshold: 50000,
        unit: "KES",
    },
]

const ICONS = {
    margin: TrendingDown,
    stock: Package,
    loss: DollarSign,
}

export function AutoPauseRules() {
    const [rules, setRules] = useState<AutoPauseRule[]>(DEFAULT_RULES)
    const [hasChanges, setHasChanges] = useState(false)

    const updateRule = (id: string, updates: Partial<AutoPauseRule>) => {
        setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)))
        setHasChanges(true)
    }

    const enabledCount = rules.filter((r) => r.enabled).length
    const isHealthy = enabledCount >= 2

    return (
        <div className="space-y-6">
            {/* Status card */}
            <Card className={`border-${isHealthy ? "emerald" : "amber"}-500/20 bg-${isHealthy ? "emerald" : "amber"}-500/5`}>
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${isHealthy ? "bg-emerald-500/10" : "bg-amber-500/10"
                                    }`}
                            >
                                {isHealthy ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium">{isHealthy ? "Protection active" : "Limited protection"}</p>
                                <p className="text-sm text-muted-foreground">
                                    {enabledCount} of {rules.length} auto-pause rules enabled
                                </p>
                            </div>
                        </div>
                        {!isHealthy && (
                            <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                                Recommended: Enable 2+ rules
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Explanation */}
            <Card className="border-border/50">
                <CardContent className="pt-4">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm">
                                Auto-pause rules automatically stop campaigns when they start losing money. This protects you from
                                runaway losses while you sleep.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Campaigns will notify you when paused so you can review and adjust.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Rules */}
            <div className="space-y-4">
                {rules.map((rule) => {
                    const Icon = ICONS[rule.icon]

                    return (
                        <Card key={rule.id} className={`transition-all ${!rule.enabled ? "opacity-60" : ""}`}>
                            <CardContent className="pt-4">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`h-10 w-10 rounded-lg flex items-center justify-center ${rule.icon === "margin"
                                                        ? "bg-red-500/10 text-red-600"
                                                        : rule.icon === "stock"
                                                            ? "bg-orange-500/10 text-orange-600"
                                                            : "bg-purple-500/10 text-purple-600"
                                                    }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{rule.name}</h3>
                                                <p className="text-sm text-muted-foreground">{rule.description}</p>
                                            </div>
                                        </div>

                                        <Switch
                                            checked={rule.enabled}
                                            onCheckedChange={(checked) => updateRule(rule.id, { enabled: checked })}
                                        />
                                    </div>

                                    {rule.enabled && (
                                        <div className="pl-13 space-y-3">
                                            <div className="flex items-center gap-4">
                                                <Label className="text-sm whitespace-nowrap">Pause threshold:</Label>
                                                {rule.unit === "KES" ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className="text-sm text-muted-foreground">KES</span>
                                                        <Input
                                                            type="number"
                                                            value={rule.threshold}
                                                            onChange={(e) => updateRule(rule.id, { threshold: Number.parseInt(e.target.value) || 0 })}
                                                            className="w-32"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Slider
                                                            value={[rule.threshold]}
                                                            onValueChange={([value]) => updateRule(rule.id, { threshold: value })}
                                                            max={rule.unit === "%" ? 25 : 100}
                                                            min={rule.unit === "%" ? 0 : 1}
                                                            step={1}
                                                            className="flex-1"
                                                        />
                                                        <Badge variant="secondary" className="w-16 justify-center">
                                                            {rule.threshold}
                                                            {rule.unit}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Example scenario */}
                                            <div className="p-3 rounded-md bg-muted/50 text-sm">
                                                <span className="text-muted-foreground">Example: </span>
                                                {rule.id === "margin" && (
                                                    <span>If a 15% discount campaign's margin drops to {rule.threshold}%, it auto-pauses</span>
                                                )}
                                                {rule.id === "stock" && (
                                                    <span>When promotional stock hits {rule.threshold} units, campaign auto-pauses</span>
                                                )}
                                                {rule.id === "loss" && (
                                                    <span>If campaign loses KES {rule.threshold.toLocaleString()} total, it auto-pauses</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
                <Button disabled={!hasChanges}>Save auto-pause rules</Button>
            </div>
        </div>
    )
}
