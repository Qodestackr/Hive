"use client";

import { useState } from "react";
import { useAlertsSummary, useResolveAlert } from "@/lib/api-client";
import { DataTableSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/table";
import { AlertTriangle, CheckCircle, Clock, ArrowRight, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AlertsPage() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<string>("active");
    const { data: summary, isLoading } = useAlertsSummary();
    const resolveMutation = useResolveAlert();

    if (isLoading) return <DataTableSkeleton />;

    const alerts = summary?.alerts || [];
    const filteredAlerts = statusFilter === "all"
        ? alerts
        : alerts.filter((a: any) => a.status === statusFilter);

    const handleResolve = async (campaignId: string, alertId: string) => {
        try {
            await resolveMutation.mutateAsync({
                campaignId,
                alertId,
                data: { status: "resolved", notes: "Resolved via dashboard" }
            });
            toast.success("Alert resolved");
        } catch (error) {
            toast.error("Failed to resolve alert");
        }
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Profit Alerts
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Real-time monitoring of campaign profitability
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active Alerts</SelectItem>
                            <SelectItem value="acknowledged">Acknowledged</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="all">All History</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Critical Summary */}
            {summary?.criticalCount > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">
                                Critical Alerts
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                                {summary.criticalCount}
                            </div>
                            <p className="text-xs text-red-700 dark:text-red-300">
                                Campaigns requiring immediate attention
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Severity</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Current Margin</TableHead>
                            <TableHead>Detected</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAlerts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                    No alerts found matching your filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAlerts.map((alert: any) => (
                                <TableRow key={alert.id}>
                                    <TableCell>
                                        {alert.severity === "critical" ? (
                                            <Badge variant="destructive" className="gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Critical
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                                Warning
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {alert.campaignName}
                                    </TableCell>
                                    <TableCell>
                                        {alert.message}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-red-600 font-mono">
                                            <TrendingDown className="mr-1 h-4 w-4" />
                                            {alert.currentMargin}%
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            Threshold: {alert.threshold}%
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-zinc-500">
                                        {format(new Date(alert.createdAt), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {alert.status !== "resolved" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleResolve(alert.campaignId, alert.id)}
                                                    disabled={resolveMutation.isPending}
                                                >
                                                    Resolve
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" asChild>
                                                <Link href={`/campaigns/${alert.campaignId}`}>
                                                    View Campaign <ArrowRight className="ml-1 h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
