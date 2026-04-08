"use client";

import { useCampaignHealth, useCaptureROI, useSlowMovers } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { BarChart, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { DataTableSkeleton } from "@/components/ui/loading-skeleton";

export default function AnalyticsPage() {
    const { data: health, isLoading: healthLoading } = useCampaignHealth();
    const { data: roi, isLoading: roiLoading } = useCaptureROI();
    const { data: slowMovers, isLoading: slowMoversLoading } = useSlowMovers();

    if (healthLoading || roiLoading || slowMoversLoading) return <DataTableSkeleton />;

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Analytics & Intelligence
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        AI-driven insights to optimize your campaigns and inventory
                    </p>
                </div>
            </div>

            <Tabs defaultValue="health" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="health">Campaign Health</TabsTrigger>
                    <TabsTrigger value="roi">Capture ROI</TabsTrigger>
                    <TabsTrigger value="inventory">Slow Movers</TabsTrigger>
                </TabsList>

                <TabsContent value="health" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Overall Health Score</CardTitle>
                                <Activity className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">88/100</div>
                                <p className="text-xs text-zinc-500">+2% from last week</p>
                            </CardContent>
                        </Card>
                        {/* More metric cards */}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Performance Matrix</CardTitle>
                            <CardDescription>Profitability vs. Redemption Rate</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px] flex items-center justify-center text-zinc-500">
                            Chart Visualization Placeholder
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roi" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Acquisition ROI</CardTitle>
                            <CardDescription>Cost per acquisition vs. LTV by campaign</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px] flex items-center justify-center text-zinc-500">
                            ROI Chart Placeholder
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Slow Moving Inventory</CardTitle>
                            <CardDescription>Products with low turnover affecting cash flow</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Slow movers table would go here */}
                            <div className="text-center py-8 text-zinc-500">
                                No slow moving inventory detected.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
