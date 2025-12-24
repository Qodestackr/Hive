/**
 * Dashboard Overview Page
 * 
 * Main landing page showing:
 * - Campaign metrics
 * - Financial metrics
 * - Customer metrics
 * - Quick actions
 */

"use client";

import { useDashboardOverview } from "@/lib/api-client";
import { MetricCard } from "@/components/ui/metric-card";
import { MetricCardSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
    AlertCircle,
    DollarSign,
    Package,
    ShoppingCart,
    TrendingUp,
    Users,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { data, isLoading, error } = useDashboardOverview();

    if (error) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            <div>
                                <p className="font-medium">Failed to load dashboard</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {error.message}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    const formatNumber = (num: number) =>
        new Intl.NumberFormat("en-KE").format(num);

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Dashboard
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Overview of your campaigns, customers, and profit metrics
                </p>
            </div>

            {/* Campaign Metrics */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Campaigns
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <>
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                        </>
                    ) : (
                        <>
                            <MetricCard
                                title="Total Campaigns"
                                value={formatNumber(data?.totalCampaigns || 0)}
                                icon={ShoppingCart}
                                color="blue"
                            />
                            <MetricCard
                                title="Active Campaigns"
                                value={formatNumber(data?.activeCampaigns || 0)}
                                icon={TrendingUp}
                                color="green"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Financial Metrics */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Financial Performance
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {isLoading ? (
                        <>
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                        </>
                    ) : (
                        <>
                            <MetricCard
                                title="Total Profit"
                                value={formatMoney(data?.totalProfit || 0)}
                                icon={DollarSign}
                                color="green"
                            />
                            <MetricCard
                                title="Total Revenue"
                                value={formatMoney(data?.totalRevenue || 0)}
                                icon={DollarSign}
                                color="blue"
                            />
                            <MetricCard
                                title="Total Redemptions"
                                value={formatNumber(data?.totalRedemptions || 0)}
                                icon={Package}
                                color="purple"
                            />
                            <MetricCard
                                title="Profitable Redemptions"
                                value={formatNumber(data?.profitableRedemptions || 0)}
                                icon={TrendingUp}
                                color="emerald"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Customer Metrics */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Customer Base
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {isLoading ? (
                        <>
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                        </>
                    ) : (
                        <>
                            <MetricCard
                                title="Total Customers"
                                value={formatNumber(data?.totalCustomers || 0)}
                                icon={Users}
                                color="blue"
                            />
                            <MetricCard
                                title="Verified Customers"
                                value={formatNumber(data?.verifiedCustomers || 0)}
                                icon={Users}
                                color="green"
                            />
                            <MetricCard
                                title="Opted-In Customers"
                                value={formatNumber(data?.optedInCustomers || 0)}
                                icon={Users}
                                color="purple"
                            />
                            <MetricCard
                                title="Lifetime Value"
                                value={formatMoney(data?.lifetimeValue || 0)}
                                icon={DollarSign}
                                color="orange"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild>
                            <Link href="/campaigns/new">New Campaign</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/products/new">Add Product</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/customers/new">Add Customer</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/alerts">View Alerts</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
