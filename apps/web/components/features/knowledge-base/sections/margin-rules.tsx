"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Label } from "@repo/ui/components/label"
import { Slider } from "@repo/ui/components/slider"
import { Switch } from "@repo/ui/components/switch"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { AlertTriangle, CheckCircle2, Info, Wine, Beer, Martini, Sparkles } from "lucide-react"

type Category = "spirits" | "wines" | "beers" | "rtds"

interface MarginConfig {
    minMargin: number
    targetMargin: number
    aiCanOverride: boolean
}

const categoryIcons = {
    spirits: Wine,
    wines: Martini,
    beers: Beer,
    rtds: Wine,
}

const categoryLabels = {
    spirits: "Spirits",
    wines: "Wines",
    beers: "Beers",
    rtds: "RTDs & Ciders",
}

// Smart defaults based on Kenyan liquor market
const SMART_DEFAULTS: Record<Category, MarginConfig> = {
    spirits: { minMargin: 15, targetMargin: 25, aiCanOverride: false },
    wines: { minMargin: 20, targetMargin: 35, aiCanOverride: true },
    beers: { minMargin: 8, targetMargin: 15, aiCanOverride: true },
    rtds: { minMargin: 12, targetMargin: 22, aiCanOverride: true },
}

export function MarginRules() {
    const [configs, setConfigs] = useState<Record<Category, MarginConfig>>(SMART_DEFAULTS)
    const [hasChanges, setHasChanges] = useState(false)

    const updateConfig = (category: Category, updates: Partial<MarginConfig>) => {
        setConfigs((prev) => ({
            ...prev,
            [category]: { ...prev[category], ...updates },
        }))
        setHasChanges(true)
    }

    const resetToDefaults = () => {
        setConfigs(SMART_DEFAULTS)
        setHasChanges(false)
    }

    return (
        <div className="space-y-6">
            {/* Explanation card */}
            <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="pt-4">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Why margin rules matter</p>
                            <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                                AI uses these thresholds to warn you before launching campaigns that could lose money. Campaigns below{" "}
                                <strong>minimum margin</strong> get blocked. Below <strong>target margin</strong> get warnings.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category cards */}
            <div className="grid gap-4">
                {(Object.keys(configs) as Category[]).map((category) => {
                    const config = configs[category]
                    const Icon = categoryIcons[category]
                    const isHealthy = config.minMargin >= SMART_DEFAULTS[category].minMargin * 0.8

                    return (
                        <Card key={category} className="relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />

                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{categoryLabels[category]}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {isHealthy ? (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle2 className="h-3 w-3" /> Healthy margins configured
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-amber-600">
                                                        <AlertTriangle className="h-3 w-3" /> Below recommended
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`${category}-ai`} className="text-xs text-muted-foreground">
                                            AI can override
                                        </Label>
                                        <Switch
                                            id={`${category}-ai`}
                                            checked={config.aiCanOverride}
                                            onCheckedChange={(checked) => updateConfig(category, { aiCanOverride: checked })}
                                        />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Minimum margin (blocks campaign)</Label>
                                        <Badge variant={config.minMargin < 10 ? "destructive" : "secondary"}>{config.minMargin}%</Badge>
                                    </div>
                                    <Slider
                                        value={[config.minMargin]}
                                        onValueChange={([value]) => updateConfig(category, { minMargin: value })}
                                        max={40}
                                        min={0}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Target margin (shows warning)</Label>
                                        <Badge variant="outline">{config.targetMargin}%</Badge>
                                    </div>
                                    <Slider
                                        value={[config.targetMargin]}
                                        onValueChange={([value]) => updateConfig(category, { targetMargin: value })}
                                        max={50}
                                        min={config.minMargin}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>

                                {config.aiCanOverride && (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                                        <Sparkles className="h-3 w-3" />
                                        AI can suggest campaigns below target margin if inventory is aging
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={resetToDefaults} disabled={!hasChanges}>
                    Reset to smart defaults
                </Button>
                <Button disabled={!hasChanges}>Save changes</Button>
            </div>
        </div>
    )
}
