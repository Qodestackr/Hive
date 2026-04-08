/**
 * Product Detail Page
 * 
 * Shows:
 * - Product information
 * - Current inventory status
 * - FIFO batches/inventory movements
 * - Edit/Delete actions
 */

"use client";

import { useProduct, useProductFIFOBatches } from "@/lib/api-client";
import { DetailPageSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@repo/ui/components/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/table";
import { Edit, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function ProductDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const { data: product, isLoading: productLoading } = useProduct(params.id);

    const { data: fifoBatches, isLoading: batchesLoading } =
        useProductFIFOBatches(params.id);

    if (productLoading || batchesLoading) {
        return (
            <div className="p-8">
                <DetailPageSkeleton />
            </div>
        );
    }

    if (!product) {
        return notFound();
    }

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
        }).format(amount);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-KE", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {product.name}
                        </h1>
                        <Badge
                            variant={product.status === "active" ? "default" : "secondary"}
                        >
                            {product.status}
                        </Badge>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        {product.brand && `${product.brand} • `}
                        {product.category || "Uncategorized"}
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/products/${params.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Product
                    </Link>
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Base Price</CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatMoney(product.basePrice)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Retail selling price
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Current Stock
                        </CardTitle>
                        <Package className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {product.currentStockQuantity}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Units available
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">FIFO Cost</CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatMoney(product.currentFIFOCost)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Per-unit cost basis
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Product Details */}
            {product.description && (
                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-zinc-700 dark:text-zinc-300">
                            {product.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* FIFO Batches */}
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Movements (FIFO Batches)</CardTitle>
                </CardHeader>
                <CardContent>
                    {fifoBatches && fifoBatches.batches.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right">Total Value</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fifoBatches.batches.map((batch) => (
                                    <TableRow key={batch.movementId}>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    batch.type === "arrival" ? "default" : "secondary"
                                                }
                                            >
                                                {batch.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {batch.quantity > 0 ? "+" : ""}
                                            {batch.quantity}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatMoney(batch.unitCost)}
                                        </TableCell>
                                        <TableCell className="text-right text-bold">
                                            {formatMoney(batch.quantity * batch.unitCost)}
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-600">
                                            {formatDate(batch.timestamp)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">
                            No inventory movements yet. Add stock via Purchase Orders.
                        </p>
                    )}
                    {fifoBatches && fifoBatches.batches.length > 0 && (
                        <div className="mt-4 flex justify-end border-t pt-4">
                            <div className="text-right">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Total Quantity
                                </p>
                                <p className="text-lg font-bold">
                                    {fifoBatches.totalQuantity} units
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
                <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">
                            Product ID
                        </span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-50">
                            {product.id}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Created</span>
                        <span className="text-zinc-900 dark:text-zinc-50">
                            {formatDate(product.createdAt)}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
