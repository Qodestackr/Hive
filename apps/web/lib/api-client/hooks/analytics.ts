import { analytics } from "../domains/analytics";
import { createQuery } from "../factories";

export const useCampaignHealth = createQuery("campaign-health", analytics.campaignHealth);
export const useSlowMovers = createQuery("slow-movers", analytics.slowMovers);
export const useCaptureROI = createQuery("capture-roi", analytics.captureROI);
