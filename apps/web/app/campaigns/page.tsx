/**
 * Campaigns List Page
 */

"use client";

import { useState } from "react";
import { useCampaigns } from "@/lib/api-client";
import { DataTableSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
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
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CampaignsPage() {
    const router = useRouter();
    const [status, setStatus] = useState<string>("");
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading, error } = useCampaigns({
        status: status || undefined,
        page,
        limit,
    });

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
        }).format(amount);

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Campaigns
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage your promotional campaigns
                    </p>
                </div>
                <Button asChild>
                    <Link href="/campaigns/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <Select
                    value={status}
                    onValueChange={(value) => {
                        setStatus(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </Card>

            {/* Table */}
            {isLoading ? (
                <DataTableSkeleton />
            ) : error ? (
                <Card className="p-8 text-center">
                    <p className="text-red-600">Failed to load campaigns: {error.message}</p>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Discount</TableHead>
                                <TableHead className="text-right">Codes</TableHead>
                                <TableHead className="text-right">Redeemed</TableHead>
                                <TableHead className="text-right">Profit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.campaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No campaigns found. Launch your first campaign to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.campaigns.map((campaign) => (
                                    <TableRow
                                        key={campaign.id}
                                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                        onClick={() => router.push(`/campaigns/${campaign.id}`)}
                                    >
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell>{campaign.productName}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    campaign.status === "active"
                                                        ? "default"
                                                        : campaign.status === "paused"
                                                            ? "secondary"
                                                            : "outline"
                                                }
                                            >
                                                {campaign.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {campaign.discountPercent}%
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {campaign.codesGenerated}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {campaign.codesRedeemed}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-medium ${campaign.totalProfit >= 0
                                                ? "text-emerald-600"
                                                : "text-red-600"
                                                }`}
                                        >
                                            {formatMoney(campaign.totalProfit)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
