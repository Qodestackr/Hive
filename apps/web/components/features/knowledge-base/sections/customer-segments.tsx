"use client"

import { useState } from "react"
import { Card, CardContent } from "@repo/ui/components/card"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Switch } from "@repo/ui/components/switch"
import { Crown, TrendingUp, Clock, AlertCircle, Users, Plus, Sparkles } from "lucide-react"

interface Segment {
    id: string
    name: string
    icon: "crown" | "trending" | "clock" | "alert"
    description: string
    criteria: {
        recencyDays?: number
        frequencyMin?: number
        monetaryMin?: number
        monetaryMax?: number
    }
    customerCount: number
    aiSuggested: boolean
    enabled: boolean
}

const ICONS = {
    crown: Crown,
    trending: TrendingUp,
    clock: Clock,
    alert: AlertCircle,
}

// Smart defaults based on RFM segmentation
const DEFAULT_SEGMENTS: Segment[] = [
    {
        id: "vip",
        name: "VIP Customers",
        icon: "crown",
        description: "High-value, frequent buyers - your best customers",
        criteria: { recencyDays: 30, frequencyMin: 4, monetaryMin: 50000 },
        customerCount: 45,
        aiSuggested: false,
        enabled: true,
    },
    {
        id: "growth",
        name: "Growth Potential",
        icon: "trending",
        description: "Regular buyers with room to increase spend",
        criteria: { recencyDays: 45, frequencyMin: 2, monetaryMin: 15000, monetaryMax: 50000 },
        customerCount: 127,
        aiSuggested: false,
        enabled: true,
    },
    {
        id: "at-risk",
        name: "At Risk",
        icon: "clock",
        description: "Previously active but haven't ordered recently",
        criteria: { recencyDays: 90, frequencyMin: 1, monetaryMin: 10000 },
        customerCount: 68,
        aiSuggested: true,
        enabled: true,
    },
    {
        id: "dormant",
        name: "Dormant",
        icon: "alert",
        description: "No activity in 90+ days - needs reactivation",
        criteria: { recencyDays: 180 },
        customerCount: 203,
        aiSuggested: false,
        enabled: true,
    },
]

export function CustomerSegments() {
    const [segments, setSegments] = useState<Segment[]>(DEFAULT_SEGMENTS)
    const [editingId, setEditingId] = useState<string | null>(null)

    const toggleSegment = (id: string) => {
        setSegments((prev) => prev.map((seg) => (seg.id === id ? { ...seg, enabled: !seg.enabled } : seg)))
    }

    const totalCustomers = segments.reduce((acc, seg) => acc + (seg.enabled ? seg.customerCount : 0), 0)

    return (
        <div className="space-y-6">
            {/* Overview */}
            <Card className="border-border/50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalCustomers}</p>
                                <p className="text-sm text-muted-foreground">Segmented customers</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                            <Plus className="h-4 w-4" />
                            Add segment
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Segments */}
            <div className="space-y-3">
                {segments.map((segment) => {
                    const Icon = ICONS[segment.icon]
                    const isEditing = editingId === segment.id

                    return (
                        <Card key={segment.id} className={`transition-all ${!segment.enabled ? "opacity-60" : ""}`}>
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${segment.icon === "crown"
                                                ? "bg-amber-500/10 text-amber-600"
                                                : segment.icon === "trending"
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : segment.icon === "clock"
                                                        ? "bg-orange-500/10 text-orange-600"
                                                        : "bg-red-500/10 text-red-600"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{segment.name}</h3>
                                            {segment.aiSuggested && (
                                                <Badge variant="secondary" className="gap-1 text-xs">
                                                    <Sparkles className="h-3 w-3" />
                                                    AI suggested
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{segment.description}</p>

                                        {/* Criteria badges */}
                                        <div className="flex flex-wrap gap-2">
                                            {segment.criteria.recencyDays && (
                                                <Badge variant="outline" className="text-xs">
                                                    Last order: {segment.criteria.recencyDays}d
                                                </Badge>
                                            )}
                                            {segment.criteria.frequencyMin && (
                                                <Badge variant="outline" className="text-xs">
                                                    Min orders: {segment.criteria.frequencyMin}
                                                </Badge>
                                            )}
                                            {segment.criteria.monetaryMin && (
                                                <Badge variant="outline" className="text-xs">
                                                    Min spend: KES {segment.criteria.monetaryMin.toLocaleString()}
                                                </Badge>
                                            )}
                                            {segment.criteria.monetaryMax && (
                                                <Badge variant="outline" className="text-xs">
                                                    Max spend: KES {segment.criteria.monetaryMax.toLocaleString()}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-lg font-semibold">{segment.customerCount}</p>
                                            <p className="text-xs text-muted-foreground">customers</p>
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <Switch checked={segment.enabled} onCheckedChange={() => toggleSegment(segment.id)} />
                                            <span className="text-xs text-muted-foreground">{segment.enabled ? "Active" : "Off"}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* AI insight */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                    <div className="flex gap-3">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">AI Insight</p>
                            <p className="text-sm text-muted-foreground">
                                Your "At Risk" segment has grown 23% this month. Consider launching a reactivation campaign with a 15%
                                discount on their previously purchased products.
                            </p>
                            <Button variant="link" className="h-auto p-0 text-primary text-sm">
                                Create reactivation campaign →
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
