"use client"

import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs"
import { Badge } from "@repo/ui/components/badge"
import { MarginRules } from "./sections/margin-rules"
import { CustomerSegments } from "./sections/customer-segments"
import { AILearnings } from "./sections/ai-learnings"
import { AutoPauseRules } from "./sections/auto-pause-rules"
import { Settings2, Users, Sparkles, ShieldAlert, TrendingUp, CheckCircle2 } from "lucide-react"

export function KnowledgeBase() {
    const [activeSection, setActiveSection] = useState("margins")

    // Smart defaults status - shows what's configured vs needs attention
    const configStatus = {
        margins: { configured: 3, total: 4, healthy: true },
        segments: { configured: 4, total: 4, healthy: true },
        aiLearnings: { feedbackCount: 47, accuracy: 78 },
        autoPause: { configured: 2, total: 3, healthy: false },
    }

    return (
        <div className="space-y-6">
            {/* Header with health overview */}
            <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Knowledge Base</CardTitle>
                            <CardDescription>Smart defaults that power your AI recommendations</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                <TrendingUp className="h-3 w-3" />
                                78% AI accuracy
                            </Badge>
                            <Badge variant="secondary" className="gap-1.5">
                                <Sparkles className="h-3 w-3" />
                                47 learnings
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Main sections */}
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                    <TabsTrigger
                        value="margins"
                        className="flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <Settings2 className="h-4 w-4" />
                        <span className="text-xs">Margin Rules</span>
                        {configStatus.margins.healthy ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                            <Badge variant="destructive" className="h-4 text-[10px] px-1">
                                !
                            </Badge>
                        )}
                    </TabsTrigger>

                    <TabsTrigger
                        value="segments"
                        className="flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <Users className="h-4 w-4" />
                        <span className="text-xs">Segments</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </TabsTrigger>

                    <TabsTrigger
                        value="ai-learnings"
                        className="flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs">AI Learnings</span>
                        <Badge variant="secondary" className="h-4 text-[10px] px-1">
                            {configStatus.aiLearnings.feedbackCount}
                        </Badge>
                    </TabsTrigger>

                    <TabsTrigger
                        value="auto-pause"
                        className="flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <ShieldAlert className="h-4 w-4" />
                        <span className="text-xs">Auto-Pause</span>
                        {!configStatus.autoPause.healthy && (
                            <Badge variant="destructive" className="h-4 text-[10px] px-1">
                                !
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="margins" className="mt-0">
                        <MarginRules />
                    </TabsContent>

                    <TabsContent value="segments" className="mt-0">
                        <CustomerSegments />
                    </TabsContent>

                    <TabsContent value="ai-learnings" className="mt-0">
                        <AILearnings />
                    </TabsContent>

                    <TabsContent value="auto-pause" className="mt-0">
                        <AutoPauseRules />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
