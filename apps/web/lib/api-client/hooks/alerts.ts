import { alerts } from "../domains/alerts";
import { createMutation, createQuery } from "../factories";

export const useAlertsSummary = createQuery("alerts-summary", alerts.summary);
export const useCampaignAlerts = createQuery("campaign-alerts", alerts.campaignAlerts);
export const useAlertSettings = createQuery("alert-settings", alerts.getSettings);

export const useResolveAlert = createMutation(alerts.resolve, {
    invalidateKeys: ["alerts-summary", "campaign-alerts"],
});

export const useUpdateAlertSettings = createMutation(alerts.updateSettings, {
    invalidateKeys: ["alert-settings"],
});

export const useBulkProfitCheck = createMutation(alerts.bulkCheck);
