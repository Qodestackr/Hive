
import { generateId as createId } from "@repo/utils";
import db, {
    organizations,
    products,
    campaigns,
    customers,
    promoCodes,
    inventoryMovements,
    purchaseOrderItems,
    purchaseOrders,
    eq
} from "@repo/db";
import { campaignService } from "@repo/services/src/campaign.service";
import { promoCodeService } from "@repo/services/src/promo-code.service";
import { fifoService } from "@repo/services/src/fifo.service";

async function main() {
    console.log("🚀 Starting LTV Flow Verification...");

    const orgId = `org_${createId()}`;
    const campaignId = `camp_${createId()}`;
    const productId = `prod_${createId()}`;
    const customerId = `cust_${createId()}`;
    const promoCode = `LTVTEST_${createId().substring(0, 6).toUpperCase()}`;

    try {
        // 1. Setup Organization
        console.log("1. Creating Organization...");
        await db.insert(organizations).values({
            id: orgId,
            name: "LTV Test Org",
            slug: `ltv-test-${createId()}`,
            pricingVersion: "v1",
            basePrice: 2000,
        });

        // 2. Setup Product & Inventory (FIFO Cost)
        console.log("2. Creating Product & Inventory...");
        await db.insert(products).values({
            id: productId,
            organizationId: orgId,
            name: "Test Liquor",
            sku: `SKU_${createId().substring(0, 6)}`,
            basePrice: 5000,
            currentStockQuantity: 100,
            currentFIFOCost: 3000, // Cost basis
        });

        // Mock PO Item for FIFO batch
        const poId = `po_${createId()}`;
        await db.insert(purchaseOrders).values({
            id: poId,
            organizationId: orgId,
            poNumber: `PO-${createId().substring(0, 6)}`,
            status: "received",
            orderDate: new Date(),
            receivedDate: new Date(),
            totalCost: 300000,
        });

        const poItemId = `poi_${createId()}`;
        await db.insert(purchaseOrderItems).values({
            id: poItemId,
            purchaseOrderId: poId,
            productId: productId,
            quantityOrdered: 100,
            quantityReceived: 100,
            unitCost: 3000,
            lineTotal: 300000,
            quantityRemaining: 100,
            status: "received",
        });

        // 3. Create Campaign
        console.log("3. Creating Campaign...");
        await db.insert(campaigns).values({
            id: campaignId,
            organizationId: orgId,
            name: "LTV Test Campaign",
            type: "flash_sale",
            status: "active",
            messageTemplate: "Test",
            platforms: ["whatsapp"],
            offerType: "percentage_discount",
            offerValue: 10, // 10% off
        });

        // 4. Create Customer (Opted in via Campaign)
        console.log("4. Creating Customer...");
        await db.insert(customers).values({
            id: customerId,
            organizationId: orgId,
            phoneNumber: "+254700000000",
            hasOptedIn: true,
            optInCampaignId: campaignId, // LINKED TO CAMPAIGN
            attributedRevenue: 0,
            totalSpend: 0,
        });

        // 5. Create Promo Code
        console.log("5. Creating Promo Code...");
        await db.insert(promoCodes).values({
            organizationId: orgId,
            campaignId: campaignId,
            customerId: customerId,
            productId: productId,
            code: promoCode,
            discountType: "percentage",
            discountValue: 10, // 10% off 5000 = 500 discount. Net = 4500.
            expiresAt: new Date(Date.now() + 86400000),
        });

        // 6. Redeem Promo Code
        console.log("6. Redeeming Promo Code...");
        const redemption = await promoCodeService.redeemPromoCode({
            code: promoCode,
            quantityRedeemed: 1,
        }, orgId);

        console.log("   Redemption Result:", redemption.message);
        console.log("   Net Revenue:", redemption.netRevenue);
        console.log("   Actual Profit:", redemption.actualProfit);

        if (redemption.netRevenue !== 4500) {
            throw new Error(`Expected Net Revenue 4500, got ${redemption.netRevenue}`);
        }

        // 7. Verify Customer Attribution
        console.log("7. Verifying Customer Attribution...");
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, customerId),
        });

        console.log("   Customer Total Spend:", customer?.totalSpend);
        console.log("   Customer Attributed Revenue:", customer?.attributedRevenue);

        if (customer?.attributedRevenue !== 4500) {
            throw new Error(`Expected Attributed Revenue 4500, got ${customer?.attributedRevenue}`);
        }

        // 8. Verify Campaign LTV Analysis
        console.log("8. Verifying Campaign LTV Analysis...");
        const analysis = await campaignService.getCampaignLtvAnalysis(campaignId, orgId);

        console.log("   Cohort Size:", analysis.cohortSize);
        console.log("   Total Cohort LTV:", analysis.totalCohortLTV);
        console.log("   Total Attributed Revenue:", analysis.totalAttributedRevenue);

        if (analysis.totalAttributedRevenue !== 4500) {
            throw new Error(`Expected Analysis Attributed Revenue 4500, got ${analysis.totalAttributedRevenue}`);
        }

        console.log("✅ SUCCESS: LTV Flow Verified!");

    } catch (error) {
        console.error("❌ FAILED:", error);
        process.exit(1);
    } finally {
        // Cleanup? Maybe not needed for local test DB if we want to inspect.
        process.exit(0);
    }
}

main();
