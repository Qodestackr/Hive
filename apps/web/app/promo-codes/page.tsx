"use client";

import { useState } from "react";
import { useValidatePromoCode, useRedeemPromoCode } from "@/lib/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Badge } from "@repo/ui/components/badge";
import { Search, CheckCircle, XCircle, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function PromoCodePOSPage() {
    const [code, setCode] = useState("");
    const [amount, setAmount] = useState("");
    const [validationResult, setValidationResult] = useState<any>(null);

    const validateMutation = useValidatePromoCode();
    const redeemMutation = useRedeemPromoCode();

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        try {
            const result = await validateMutation.mutateAsync({
                code,
                amount: parseFloat(amount) || 0
            });
            setValidationResult(result);
            toast.success("Code validated successfully");
        } catch (error) {
            setValidationResult(null);
            toast.error("Invalid promo code");
        }
    };

    const handleRedeem = async () => {
        if (!code || !validationResult?.valid) return;

        try {
            await redeemMutation.mutateAsync({
                code,
                amount: parseFloat(amount) || 0,
                metadata: { source: "pos_manual" }
            });
            toast.success("Promo code redeemed successfully!");
            setCode("");
            setAmount("");
            setValidationResult(null);
        } catch (error) {
            toast.error("Failed to redeem code");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    POS Redemption
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Manually validate and redeem promo codes at point of sale
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Validate Code</CardTitle>
                    <CardDescription>Enter the customer's promo code and transaction amount</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleValidate} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="code">Promo Code</Label>
                                <div className="relative">
                                    <TicketIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="code"
                                        placeholder="SUMMER2025..."
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="pl-9 font-mono uppercase"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Transaction Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-zinc-500">KES</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-12"
                                    />
                                </div>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={validateMutation.isPending || !code}
                        >
                            {validateMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="mr-2 h-4 w-4" />
                            )}
                            Validate Code
                        </Button>
                    </form>

                    {validationResult && (
                        <div className={`rounded-lg border p-4 ${validationResult.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-3">
                                {validationResult.valid ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                )}
                                <div className="flex-1 space-y-1">
                                    <p className={`font-medium ${validationResult.valid ? 'text-emerald-900' : 'text-red-900'}`}>
                                        {validationResult.valid ? "Code is Valid" : "Code Invalid"}
                                    </p>
                                    {validationResult.valid && (
                                        <div className="text-sm text-emerald-700 space-y-1">
                                            <p>Discount: <span className="font-bold">{validationResult.discountFormatted}</span></p>
                                            <p>Campaign: {validationResult.campaignName}</p>
                                            <p>Final Price: <span className="font-bold">KES {(parseFloat(amount) - (validationResult.discountAmount || 0)).toFixed(2)}</span></p>
                                        </div>
                                    )}
                                    {!validationResult.valid && (
                                        <p className="text-sm text-red-700">{validationResult.reason}</p>
                                    )}
                                </div>
                            </div>

                            {validationResult.valid && (
                                <Button
                                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={handleRedeem}
                                    disabled={redeemMutation.isPending}
                                >
                                    {redeemMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Redeem Now
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function TicketIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
        </svg>
    )
}
