"use client";

import {
    useRedeemPromoCode,
    useValidatePromoCode,
    useCampaignStats,
} from "@/lib/api-client";
import { useState } from "react";

export function PromoRedemption({ campaignId }: { campaignId: string }) {
    const [code, setCode] = useState("");

    // Query that will auto-update after redemption
    const { data: stats, refetch } = useCampaignStats(campaignId);

    // Validation (no side effects)
    const { mutate: validate, data: validationResult } =
        useValidatePromoCode();

    // Redemption (calculates FIFO profit, invalidates queries)
    const { mutate: redeem, isPending } = useRedeemPromoCode();

    const handleValidate = () => {
        validate({
            code,
            customerId: "cust_123",
        });
    };

    const handleRedeem = () => {
        redeem(
            {
                code,
                customerId: "cust_123",
                productId: "prod_123",
                quantity: 1,
            },
            {
                onSuccess: (result) => {
                    // ✅ Typed redemption result with FIFO profit
                    console.log("Redeemed! Profit:", result.profitAmount);

                    // ✅ Queries auto-invalidated, stats will refresh
                    // No manual refetch needed!
                },
            }
        );
    };

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Redeem Promo Code</h2>

            <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter promo code"
                className="border px-3 py-2 rounded w-full"
            />

            <div className="flex gap-2">
                <button
                    onClick={handleValidate}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Validate
                </button>

                <button
                    onClick={handleRedeem}
                    disabled={isPending || !code}
                    className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                    {isPending ? "Redeeming..." : "Redeem"}
                </button>
            </div>

            {/* Validation Result */}
            {validationResult && (
                <div className="p-4 bg-blue-50 rounded">
                    <p>
                        Valid: {validationResult.isValid ? "✅ Yes" : "❌ No"}
                    </p>
                    {validationResult.discountValue && (
                        <p>Discount: {validationResult.discountValue}%</p>
                    )}
                </div>
            )}

            {/* Campaign Stats (auto-updates after redemption) */}
            {stats && (
                <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold">Campaign Performance</h3>
                    <p>Total Redeemed: {stats.capturesCount}</p>
                    <p>Actual Profit: KES {stats.actualProfit?.toLocaleString()}</p>
                    <p>
                        Average Profit: KES {stats.avgProfitPerCapture?.toLocaleString()}
                    </p>
                </div>
            )}
        </div>
    );
}
