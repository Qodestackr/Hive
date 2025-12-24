"use client";

import { useState } from "react";
import { useCampaign, useCampaignStats, usePauseCampaign, useResumeCampaign } from "@/lib/api-client";
import { DetailPageSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { ArrowLeft, Play, Pause, Download, Ticket, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
    const { data: campaign, isLoading: campaignLoading } = useCampaign(params.id);
    const { data: stats, isLoading: statsLoading } = useCampaignStats(params.id);

    const pauseMutation = usePauseCampaign();
    const resumeMutation = useResumeCampaign();

    if (campaignLoading || statsLoading) return <DetailPageSkeleton />;
    if (!campaign) notFound();

    const handleToggleStatus = async () => {
        try {
            if (campaign.status === "active") {
                await pauseMutation.mutateAsync(campaign.id);
                toast.success("Campaign paused");
            } else {
                await resumeMutation.mutateAsync(campaign.id);
                toast.success("Campaign resumed");
            }
        } catch (error) {
            toast.error("Failed to update campaign status");
        }
    };

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/campaigns">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                {campaign.name}
                            </h1>
                            <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                                {campaign.status}
                            </Badge>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                            {campaign.type} • Created {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Codes
                    </Button>
                    <Button
                        variant={campaign.status === "active" ? "destructive" : "default"}
                        onClick={handleToggleStatus}
                        disabled={pauseMutation.isPending || resumeMutation.isPending}
                    >
                        {campaign.status === "active" ? (
                            <>
                                <Pause className="mr-2 h-4 w-4" /> Pause Campaign
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" /> Resume Campaign
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {formatMoney(stats?.totalProfit || 0)}
                        </div>
                        <p className="text-xs text-zinc-500">Net after discounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Redemptions</CardTitle>
                        <Ticket className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.redemptionCount || 0}</div>
                        <p className="text-xs text-zinc-500">
                            {((stats?.redemptionCount || 0) / (stats?.codesGenerated || 1) * 100).toFixed(1)}% rate
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Codes Generated</CardTitle>
                        <Ticket className="h-4 w-4 text-zinc-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.codesGenerated || 0}</div>
                        <p className="text-xs text-zinc-500">Total available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.uniqueCustomers || 0}</div>
                        <p className="text-xs text-zinc-500">Participated</p>
                    </CardContent>
                </Card>
            </div>

            {/* LTV Analysis Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>LTV Analysis</CardTitle>
                    <CardDescription>Customer retention and value over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-zinc-500">
                    Cohort Analysis Chart
                </CardContent>
            </Card>
        </div>
    );
}
