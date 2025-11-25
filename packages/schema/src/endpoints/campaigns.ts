import { z } from "zod";
import { registerRoute } from "../utils/route-builder.js";
import {
    CampaignCreateSchema,
    CampaignUpdateSchema,
    CampaignListQuerySchema,
    CampaignResponseSchema,
    CampaignListResponseSchema,
    CampaignProfitabilityCheckSchema,
    CampaignProfitabilityResponseSchema,
    CampaignStatsSchema,
} from "../campaigns/campaign.schema.js";

// ============================================================================
// CAMPAIGN ENDPOINTS (Profit Intelligence)
// ============================================================================

// Pre-flight profit check (THE KEY FEATURE)
registerRoute({
    method: 'post',
    path: '/api/v1/campaigns/profit-check',
    summary: 'Pre-flight profitability check',
    description: 'Check if a discount will be profitable based on current FIFO costs. Returns recommendations if not profitable.',
    tags: ['Campaigns', 'Profit Intelligence'],
    body: CampaignProfitabilityCheckSchema,
    response: CampaignProfitabilityResponseSchema,
    errors: {
        400: 'Invalid input data',
        404: 'Product not found',
    },
});

// Create campaign
registerRoute({
    method: 'post',
    path: '/api/v1/campaigns',
    summary: 'Create campaign',
    description: 'Create a new promotional campaign.',
    tags: ['Campaigns'],
    body: CampaignCreateSchema,
    response: CampaignResponseSchema,
    errors: {
        400: 'Invalid input data',
    },
});

// List campaigns
registerRoute({
    method: 'get',
    path: '/api/v1/campaigns',
    summary: 'List campaigns',
    description: 'Get paginated list of campaigns with filtering.',
    tags: ['Campaigns'],
    query: CampaignListQuerySchema,
    response: CampaignListResponseSchema,
    errors: {
        400: 'Invalid query parameters',
    },
});

// Get campaign by ID
registerRoute({
    method: 'get',
    path: '/api/v1/campaigns/{id}',
    summary: 'Get campaign by ID',
    description: 'Get full campaign details.',
    tags: ['Campaigns'],
    params: z.object({
        id: z.string().openapi({ param: { name: 'id', in: 'path' }, example: 'camp_123' }),
    }),
    response: CampaignResponseSchema,
    errors: {
        404: 'Campaign not found',
    },
});

// Update campaign
registerRoute({
    method: 'patch',
    path: '/api/v1/campaigns/{id}',
    summary: 'Update campaign',
    description: 'Update campaign details or status.',
    tags: ['Campaigns'],
    params: z.object({
        id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
    }),
    body: CampaignUpdateSchema,
    response: CampaignResponseSchema,
    errors: {
        400: 'Invalid input data',
        404: 'Campaign not found',
    },
});

// Get campaign stats
registerRoute({
    method: 'get',
    path: '/api/v1/campaigns/{id}/stats',
    summary: 'Get campaign statistics',
    description: 'Get real-time campaign performance stats including profit metrics.',
    tags: ['Campaigns', 'Profit Intelligence'],
    params: z.object({
        id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
    }),
    response: CampaignStatsSchema,
    errors: {
        404: 'Campaign not found',
    },
});
