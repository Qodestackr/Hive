import { createQuery, createMutation } from "../factories";
import { campaigns } from "../domains/campaigns";


export const useCampaigns = createQuery("campaigns", campaigns.list);
export const useCampaign = createQuery("campaign", campaigns.get);

export const useCampaignStats = createQuery("campaign-stats", campaigns.stats);

export const useCreateCampaign = createMutation(campaigns.create, {
    invalidateKeys: ["campaigns"],
});

export const useUpdateCampaign = createMutation(campaigns.update, {
    invalidateKeys: ["campaigns", "campaign"],
});

export const useCheckCampaignProfitability = createMutation(
    campaigns.checkProfitability
    // No invalidation needed - this is a check operation
);
