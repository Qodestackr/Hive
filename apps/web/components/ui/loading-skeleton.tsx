/**
 * Loading skeleton components
 * 
 * Provides skeleton loaders for different layouts:
 * - MetricCards (dashboard)
 * - DataTable (list pages)
 * - DetailPage (detail views)
 */

import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";

export function MetricCardSkeleton() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Table */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                {/* Table header */}
                <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>

                {/* Table rows */}
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="border-b border-zinc-200 p-4 last:border-b-0 dark:border-zinc-800"
                    >
                        <div className="flex gap-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                </div>
            </div>
        </div>
    );
}

export function DetailPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Cards grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
            </div>

            {/* Content sections */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
