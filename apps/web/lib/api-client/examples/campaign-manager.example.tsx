"use client";

import {
    useCampaigns,
    useCreateCampaign,
    useCheckCampaignProfitability,
} from "@/lib/api-client";
import { useState } from "react";

export function CampaignManager() {
    const [isCreating, setIsCreating] = useState(false);

    // ✅ Fully typed query with autocomplete
    const { data: campaigns, isLoading } = useCampaigns({
        status: "active",
        limit: 10,
    });

    // ✅ Fully typed mutation
    const { mutate: createCampaign, isPending } = useCreateCampaign();

    // ✅ Pre-flight profitability check
    const { mutate: checkProfit } = useCheckCampaignProfitability();

    const handleCreate = () => {
        // TypeScript enforces correct shape
        createCampaign(
            {
                name: "Flash Sale",
                type: "flash_sale",
                status: "draft",
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                targetAudience: "all_users",
                budgetLimit: null,
                description: "Limited time offer",
            },
            {
                onSuccess: (campaign) => {
                    // ✅ 'campaign' is typed as CampaignResponse
                    console.log("Created campaign:", campaign.id);
                    setIsCreating(false);
                },
                onError: (error) => {
                    console.error("Failed to create campaign:", error);
                },
            }
        );
    };

    const handleProfitCheck = () => {
        checkProfit({
            productId: "prod_123",
            discountType: "percentage",
            discountValue: 15,
            expectedQuantity: 100,
        });
    };

    if (isLoading) return <div>Loading campaigns...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Campaign Manager</h1>

            {/* Campaign List */}
            <div className="space-y-2 mb-6">
                {campaigns?.data.map((campaign) => (
                    <div key={campaign.id} className="border p-4 rounded">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.type}</p>
                        <p className="text-sm">
                            Actual Profit: KES {campaign.actualProfit?.toLocaleString() || 0}
                        </p>
                    </div>
                ))}
            </div>

            {/* Create Campaign */}
            {!isCreating ? (
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Create Campaign
                </button>
            ) : (
                <div className="space-y-2">
                    <button
                        onClick={handleCreate}
                        disabled={isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                    >
                        {isPending ? "Creating..." : "Confirm Create"}
                    </button>
                    <button
                        onClick={handleProfitCheck}
                        className="ml-2 px-4 py-2 bg-purple-600 text-white rounded"
                    >
                        Check Profitability First
                    </button>
                </div>
            )}
        </div>
    );
}
