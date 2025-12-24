"use client";

import { useState } from "react";
import { useReconcileOrganization, useReconcileProduct } from "@/lib/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Badge } from "@repo/ui/components/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/table";
import { RefreshCw, CheckCircle, AlertCircle, Search, Package } from "lucide-react";
import { toast } from "sonner";

export default function ReconciliationPage() {
    const [search, setSearch] = useState("");
    const reconcileAllMutation = useReconcileOrganization();

    // Mock data for now as we don't have a list endpoint in the domain yet
    // In real implementation, we'd use a useReconciliationList hook
    const discrepancies = [
        { id: "1", productName: "Premium Widget", expected: 150, actual: 148, lastChecked: new Date().toISOString() },
        { id: "2", productName: "Super Gadget", expected: 50, actual: 50, lastChecked: new Date().toISOString() },
    ];

    const handleReconcileAll = async () => {
        try {
            await reconcileAllMutation.mutateAsync(undefined, {
                onSuccess: () => toast.success("Organization reconciliation started")
            });
        } catch (error) {
            toast.error("Failed to start reconciliation");
        }
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Inventory Reconciliation
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Ensure your physical stock matches digital records
                    </p>
                </div>
                <Button onClick={handleReconcileAll} disabled={reconcileAllMutation.isPending}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${reconcileAllMutation.isPending ? 'animate-spin' : ''}`} />
                    Reconcile All Products
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inventory Accuracy</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98.5%</div>
                        <p className="text-xs text-zinc-500">Last 30 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Discrepancies</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-zinc-500">Products needing attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value at Risk</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">KES 45,200</div>
                        <p className="text-xs text-zinc-500">Based on FIFO cost</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Discrepancy Report</CardTitle>
                    <CardDescription>Products where expected count differs from actual</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">System Count</TableHead>
                                <TableHead className="text-right">Physical Count</TableHead>
                                <TableHead className="text-right">Difference</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {discrepancies.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.expected}</TableCell>
                                    <TableCell className="text-right">{item.actual}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {item.actual - item.expected}
                                    </TableCell>
                                    <TableCell>
                                        {item.actual === item.expected ? (
                                            <Badge variant="outline" className="text-emerald-600 border-emerald-200">Matched</Badge>
                                        ) : (
                                            <Badge variant="destructive">Mismatch</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline">Correct</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
