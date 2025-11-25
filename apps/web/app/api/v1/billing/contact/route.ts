import {
    BillingContactCreateSchema,
    BillingContactResponseSchema
} from "@repo/schema";
import db from "@repo/db";
import { withDbOperation } from "@repo/db";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const POST = createWorkspaceRoute({
    inputSchema: BillingContactCreateSchema,
    outputSchema: BillingContactResponseSchema,

    handler: async (data, { workspace }) => {
        // PURE BUSINESS LOGIC - no ceremony!
        // const billingContact = await withDbOperation({
        //     operation: "upsert",
        //     table: "billingContact",
        //     context: { organizationId: workspace.id }
        // }, () => db.billingContact.upsert({
        //     where: { organizationId: workspace.id },
        //     update: data,
        //     create: {
        //         ...data,
        //         organizationId: workspace.id,
        //     },
        // }));

        // return billingContact;
    },

    options: {
        operationName: "createBillingContact",
        requiredPermissions: ["billing.contact.write"],
        errorContext: {
            feature: "billing",
            action: "create-contact"
        },
    },
});

export const GET = createWorkspaceRoute({
    outputSchema: BillingContactResponseSchema,

    handler: async (_, { workspace }) => {
        // const contact = await withDbOperation({
        //     operation: "findUnique",
        //     table: "billingContact",
        //     context: { organizationId: workspace.id }
        // }, () => db.billingContact.findUnique({
        //     where: { organizationId: workspace.id },
        // }));

        // return contact || workspace; // Fallback to org info
    },

    options: {
        operationName: "getBillingContact",
        requiredPermissions: ["billing.contact.view"],
        cacheResponse: true,
        cacheTTL: 300, // 5 min
        errorContext: { feature: "billing", action: "get-contact" },
    },
});