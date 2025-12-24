"use client";

import { useState } from "react";
import {
    useCustomer,
    useVerifyAge,
    useOptIn,
    useOptOut,
} from "@/lib/api-client";
import { DetailPageSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@repo/ui/components/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import { Label } from "@repo/ui/components/label";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    ShieldCheck,
    Mail,
    Phone,
    Calendar,
    DollarSign,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CustomerDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const { data: customer, isLoading } = useCustomer(params.id);
    const verifyAgeMutation = useVerifyAge();
    const optInMutation = useOptIn();
    const optOutMutation = useOptOut();

    const [isVerifyOpen, setIsVerifyOpen] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState<string>("id_check");

    if (isLoading) {
        return <DetailPageSkeleton />;
    }

    if (!customer) {
        notFound();
    }

    const handleVerifyAge = async () => {
        try {
            await verifyAgeMutation.mutateAsync(
                { id: customer.id, method: verificationMethod },
                {
                    onSuccess: () => {
                        toast.success("Age verified successfully");
                        setIsVerifyOpen(false);
                    },
                },
            );
        } catch (error) {
            toast.error("Failed to verify age");
        }
    };

    const handleOptIn = async () => {
        try {
            await optInMutation.mutateAsync(customer.id, {
                onSuccess: () => toast.success("Customer opted in"),
            });
        } catch (error) {
            toast.error("Failed to opt-in customer");
        }
    };

    const handleOptOut = async () => {
        try {
            await optOutMutation.mutateAsync(customer.id, {
                onSuccess: () => toast.success("Customer opted out"),
            });
        } catch (error) {
            toast.error("Failed to opt-out customer");
        }
    };

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
        }).format(amount);

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {customer.name || "Unnamed Customer"}
                        </h1>
                        {customer.isAgeVerified ? (
                            <Badge variant="default" className="gap-1 bg-emerald-600">
                                <ShieldCheck className="h-3 w-3" />
                                Verified
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="gap-1">
                                Unverified
                            </Badge>
                        )}
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 font-mono mt-1">
                        {customer.phone}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Age Verification Dialog */}
                    {!customer.isAgeVerified && (
                        <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Verify Age
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Verify Customer Age</DialogTitle>
                                    <DialogDescription>
                                        Confirm that this customer is of legal age (18+).
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Verification Method</Label>
                                        <Select
                                            value={verificationMethod}
                                            onValueChange={setVerificationMethod}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="id_check">Physical ID Check</SelectItem>
                                                <SelectItem value="mpesa_name">M-Pesa Name Match</SelectItem>
                                                <SelectItem value="manual">Manual Override</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsVerifyOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleVerifyAge}
                                        disabled={verifyAgeMutation.isPending}
                                    >
                                        {verifyAgeMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Confirm Verification
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Opt-in/out Controls */}
                    {customer.hasOptedIn ? (
                        <Button
                            variant="outline"
                            onClick={handleOptOut}
                            disabled={optOutMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            Opt-Out
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            onClick={handleOptIn}
                            disabled={optInMutation.isPending}
                        >
                            Opt-In
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Customer Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-zinc-500" />
                            <span className="font-mono">{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-zinc-500" />
                            <span>{customer.email || "No email provided"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-zinc-500" />
                            <span>
                                Joined {format(new Date(customer.createdAt), "MMM d, yyyy")}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* LTV Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lifetime Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">
                            {formatMoney(customer.attributedRevenue || 0)}
                        </div>
                        <p className="text-sm text-zinc-500 mt-1">
                            Total attributed revenue from campaigns
                        </p>
                    </CardContent>
                </Card>

                {/* Compliance Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Compliance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-600">Age Verification</span>
                            {customer.isAgeVerified ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                    Verified
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-200">
                                    Pending
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-600">Marketing Opt-In</span>
                            {customer.hasOptedIn ? (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                    Opted In
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-zinc-500">
                                    Opted Out
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity History */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign History</CardTitle>
                    <CardDescription>
                        Recent promo code redemptions and interactions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Campaign</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Placeholder for history - would come from a separate endpoint or expanded customer object */}
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                                    No recent activity found.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
