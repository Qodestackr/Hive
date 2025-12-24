"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Progress } from "@repo/ui/components/progress"
import { ThumbsUp, ThumbsDown, Sparkles, RotateCcw, Calendar } from "lucide-react"

interface Learning {
    id: string
    type: "offer_accepted" | "offer_rejected" | "campaign_success" | "campaign_failure"
    context: string
    decision: string
    outcome?: string
    timestamp: Date
    confidence: number
}

// Sample learnings from user feedback
const LEARNINGS: Learning[] = [
    {
        id: "1",
        type: "offer_accepted",
        context: "Slow-moving Johnnie Walker Red, 45 days in stock",
        decision: "15% discount to VIP segment",
        outcome: "Cleared 80% of stock, 22% margin maintained",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        confidence: 92,
    },
    {
        id: "2",
        type: "offer_rejected",
        context: "Black Friday promo suggestion",
        decision: "25% off all spirits",
        outcome: "User chose 15% instead - campaigns were profitable",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        confidence: 78,
    },
    {
        id: "3",
        type: "campaign_success",
        context: "End of month push, wines category",
        decision: "Bundle: Buy 2 get 10% off",
        outcome: "47 redemptions, KES 89,000 profit",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        confidence: 88,
    },
    {
        id: "4",
        type: "offer_accepted",
        context: "Supplier promo: Hennessy VS discount",
        decision: "Pass through 12% to At-Risk segment",
        outcome: "Reactivated 23 dormant customers",
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        confidence: 85,
    },
    {
        id: "5",
        type: "campaign_failure",
        context: "Premium whisky weekend special",
        decision: "20% off Glenfiddich 18yr",
        outcome: "Only 3 redemptions - price still too high for market",
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        confidence: 65,
    },
]

export function AILearnings() {
    const [filter, setFilter] = useState<"all" | "positive" | "negative">("all")

    const filteredLearnings = LEARNINGS.filter((learning) => {
        if (filter === "all") return true
        if (filter === "positive") return learning.type === "offer_accepted" || learning.type === "campaign_success"
        return learning.type === "offer_rejected" || learning.type === "campaign_failure"
    })

    const stats = {
        total: LEARNINGS.length,
        accepted: LEARNINGS.filter((l) => l.type === "offer_accepted").length,
        rejected: LEARNINGS.filter((l) => l.type === "offer_rejected").length,
        avgConfidence: Math.round(LEARNINGS.reduce((acc, l) => acc + l.confidence, 0) / LEARNINGS.length),
    }

    const getTypeIcon = (type: Learning["type"]) => {
        switch (type) {
            case "offer_accepted":
            case "campaign_success":
                return <ThumbsUp className="h-4 w-4 text-emerald-600" />
            case "offer_rejected":
            case "campaign_failure":
                return <ThumbsDown className="h-4 w-4 text-red-500" />
        }
    }

    const getTypeBadge = (type: Learning["type"]) => {
        switch (type) {
            case "offer_accepted":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Offer accepted</Badge>
            case "offer_rejected":
                return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Offer rejected</Badge>
            case "campaign_success":
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Campaign success</Badge>
            case "campaign_failure":
                return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Campaign underperformed</Badge>
        }
    }

    const formatDate = (date: Date) => {
        const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
        if (days === 0) return "Today"
        if (days === 1) return "Yesterday"
        return `${days} days ago`
    }

    return (
        <div className="space-y-6">
            {/* Stats overview */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total learnings</p>
                            </div>
                            <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-emerald-600">{stats.accepted}</p>
                                <p className="text-sm text-muted-foreground">Accepted suggestions</p>
                            </div>
                            <ThumbsUp className="h-8 w-8 text-emerald-500/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">AI Confidence</p>
                                <p className="text-sm font-semibold">{stats.avgConfidence}%</p>
                            </div>
                            <Progress value={stats.avgConfidence} className="h-2" />
                            <p className="text-xs text-muted-foreground">Based on your feedback</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and learnings list */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Learning History</CardTitle>
                            <CardDescription>How AI improves from your decisions</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                                All
                            </Button>
                            <Button
                                variant={filter === "positive" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter("positive")}
                                className="gap-1"
                            >
                                <ThumbsUp className="h-3 w-3" />
                                Positive
                            </Button>
                            <Button
                                variant={filter === "negative" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter("negative")}
                                className="gap-1"
                            >
                                <ThumbsDown className="h-3 w-3" />
                                Negative
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {filteredLearnings.map((learning) => (
                        <div key={learning.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">{getTypeIcon(learning.type)}</div>

                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {getTypeBadge(learning.type)}
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(learning.timestamp)}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="text-muted-foreground">Context:</span> {learning.context}
                                        </p>
                                        <p className="text-sm">
                                            <span className="text-muted-foreground">Decision:</span>{" "}
                                            <span className="font-medium">{learning.decision}</span>
                                        </p>
                                        {learning.outcome && (
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">Outcome:</span>{" "}
                                                <span
                                                    className={
                                                        learning.type === "offer_accepted" || learning.type === "campaign_success"
                                                            ? "text-emerald-600"
                                                            : "text-muted-foreground"
                                                    }
                                                >
                                                    {learning.outcome}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold">{learning.confidence}%</p>
                                    <p className="text-xs text-muted-foreground">confidence</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Reset option */}
            <Card className="border-red-500/20">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <RotateCcw className="h-5 w-5 text-red-500" />
                            <div>
                                <p className="text-sm font-medium">Reset AI learnings</p>
                                <p className="text-xs text-muted-foreground">Start fresh - AI will revert to smart defaults</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-500/20 hover:bg-red-500/10 bg-transparent"
                        >
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
