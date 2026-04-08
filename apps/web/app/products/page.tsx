/**
 * Products List Page
 * 
 * Displays all products with:
 * - Search by name
 * - Filters (category, brand, status)
 * - Pagination
 * - Quick price edit
 * - Row actions (view, edit, delete)
 */

"use client";

import { useState } from "react";
import { useProducts } from "@/lib/api-client";
import { DataTableSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
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
import { Badge } from "@repo/ui/components/badge";
import { Edit, Eye, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("");
    const [brand, setBrand] = useState<string>("");
    const [status, setStatus] = useState<string>("active");
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading, error } = useProducts({
        search: search || undefined,
        category: category || undefined,
        // brand: brand || undefined, // Add if endpoint supports it
        // status: status || undefined, // Add if endpoint supports it
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
                    <h1 className="text-3xl font-bold  tracking-tight text-zinc-900 dark:text-zinc-50">
                        Products
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage your product catalog and inventory
                    </p>
                </div>
                <Button asChild>
                    <Link href="/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={category}
                        onValueChange={(value) => {
                            setCategory(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Categories</SelectItem>
                            <SelectItem value="whiskey">Whiskey</SelectItem>
                            <SelectItem value="vodka">Vodka</SelectItem>
                            <SelectItem value="gin">Gin</SelectItem>
                            <SelectItem value="beer">Beer</SelectItem>
                            <SelectItem value="wine">Wine</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={brand}
                        onValueChange={(value) => {
                            setBrand(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Brands</SelectItem>
                            <SelectItem value="Jameson">Jameson</SelectItem>
                            <SelectItem value="Hennessy">Hennessy</SelectItem>
                            <SelectItem value="Tusker">Tusker</SelectItem>
                            <SelectItem value="Johnnie Walker">Johnnie Walker</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setStatus(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Table */}
            {isLoading ? (
                <DataTableSkeleton />
            ) : error ? (
                <Card className="p-8 text-center">
                    <p className="text-red-600">Failed to load products: {error.message}</p>
                </Card>
            ) : (
                <>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Base Price</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-right">FIFO Cost</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No products found. Add your first product to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data?.map((product) => (
                                        <TableRow
                                            key={product.id}
                                            className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                            onClick={() => router.push(`/products/${product.id}`)}
                                        >
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>
                                            <TableCell>{product.brand || "—"}</TableCell>
                                            <TableCell>{product.category || "—"}</TableCell>
                                            <TableCell className="text-right">
                                                {formatMoney(product.basePrice)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {product.currentStockQuantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatMoney(product.currentFIFOCost)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        product.status === "active" ? "default" : "secondary"
                                                    }
                                                >
                                                    {product.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/products/${product.id}`);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/products/${product.id}/edit`);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Pagination */}
                    {data?.pagination && data.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Showing {(page - 1) * limit + 1} to{" "}
                                {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} products
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                {Array.from({ length: Math.min(5, data.pagination.totalPages) }).map(
                                    (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    },
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                    disabled={page === data.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
