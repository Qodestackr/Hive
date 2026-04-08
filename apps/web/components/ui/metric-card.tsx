/**
 * Reusable metric card for dashboard and analytics
 * 
 * Displays a single metric with:
 * - Icon
 * - Title
 * - Value (with animation support)
 * - Optional trend indicator
 */

"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        direction: "up" | "down";
        value: string;
    };
    color?: "blue" | "green" | "emerald" | "orange" | "red" | "purple" | "zinc";
    className?: string;
}

const colorClasses = {
    blue: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-600 dark:text-blue-400",
    },
    green: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-600 dark:text-emerald-400",
    },
    emerald: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-600 dark:text-emerald-400",
    },
    orange: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-400",
    },
    red: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-600 dark:text-red-400",
    },
    purple: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-600 dark:text-purple-400",
    },
    zinc: {
        bg: "bg-zinc-100 dark:bg-zinc-800",
        text: "text-zinc-600 dark:text-zinc-400",
    },
};

export function MetricCard({
    title,
    value,
    icon: Icon,
    trend,
    color = "blue",
    className,
}: MetricCardProps) {
    const { bg, text } = colorClasses[color];

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {title}
                        </p>
                        <motion.p
                            className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            key={String(value)}
                        >
                            {value}
                        </motion.p>
                        {trend && (
                            <div
                                className={cn(
                                    "mt-2 flex items-center gap-1 text-sm",
                                    trend.direction === "up"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400",
                                )}
                            >
                                {trend.direction === "up" ? (
                                    <TrendingUp className="h-4 w-4" />
                                ) : (
                                    <TrendingDown className="h-4 w-4" />
                                )}
                                <span>{trend.value}</span>
                            </div>
                        )}
                    </div>
                    <div className={cn("rounded-full p-3", bg)}>
                        <Icon className={cn("h-6 w-6", text)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
