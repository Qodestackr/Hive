"use client";

import { useState } from "react";
import { useCustomers } from "@/lib/api-client";
import { DataTableSkeleton } from "@/components/ui/loading-skeleton";
import { BulkImportModal } from "@/components/features/customers/bulk-import-modal";
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
import { CheckCircle, XCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomersPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [verified, setVerified] = useState<string>("");
    const [optedIn, setOptedIn] = useState<string>("");
    const [status, setStatus] = useState<string>("active");
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading, error } = useCustomers({
        search: search || undefined,
        // Add filters when endpoint supports them
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
                        Customers
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage your customer base and compliance
                    </p>
                </div>
                <div className="flex gap-2">
                    <BulkImportModal />
                    <Button asChild>
                        <Link href="/customers/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Customer
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search by phone, name, email..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={verified}
                        onValueChange={(value) => {
                            setVerified(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Age Verification" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="not-verified">Not Verified</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={optedIn}
                        onValueChange={(value) => {
                            setOptedIn(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Opt-In Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All</SelectItem>
                            <SelectItem value="opted-in">Opted In</SelectItem>
                            <SelectItem value="not-opted-in">Not Opted In</SelectItem>
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
                            <SelectItem value="">All</SelectItem>
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
                    <p className="text-red-600">Failed to load customers: {error.message}</p>
                </Card>
            ) : (
                <>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Age Verified</TableHead>
                                    <TableHead className="text-center">Opted In</TableHead>
                                    <TableHead className="text-right">LTV</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No customers found. Add your first customer to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data?.map((customer) => (
                                        <TableRow
                                            key={customer.id}
                                            className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                            onClick={() => router.push(`/customers/${customer.id}`)}
                                        >
                                            <TableCell className="font-mono text-sm">
                                                {customer.phone}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {customer.name || "—"}
                                            </TableCell>
                                            <TableCell>{customer.email || "—"}</TableCell>
                                            <TableCell className="text-center">
                                                {customer.isAgeVerified ? (
                                                    <Badge variant="default" className="gap-1">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Verified
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <XCircle className="h-3 w-3" />
                                                        Not Verified
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {customer.hasOptedIn ? (
                                                    <Badge variant="default" className="gap-1">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Opted In
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="gap-1">
                                                        Opted Out
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 font-medium">
                                                {customer.attributedRevenue
                                                    ? formatMoney(customer.attributedRevenue)
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/customers/${customer.id}`);
                                                    }}
                                                >
                                                    View
                                                </Button>
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
                                {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} customers
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
                                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                                    disabled={page === data.pagination.totalPages}
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
