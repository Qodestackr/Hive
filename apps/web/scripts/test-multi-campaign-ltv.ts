import { generateId as createId } from "@repo/utils";
import db, {
    organizations,
    products,
    campaigns,
    customers,
    promoCodes,
    purchaseOrderItems,
    purchaseOrders,
    eq
} from "@repo/db";
import { campaignService } from "@repo/services/src/campaign.service";
import { promoCodeService } from "@repo/services/src/promo-code.service";

/**
 * Multi-Campaign LTV Attribution Test
 * 
 * CRITICAL TEST: Verifies that campaign LTV remains accurate when:
 * 1. A customer participates in multiple campaigns
 * 2. Customer's optInCampaignId changes over time
 * 3. Each campaign's LTV calculation is isolated
 * 
 * This test validates the FIX for the attribution bug where using
 * customers.optInCampaignId for LTV queries caused historical data corruption.
 */
async function main() {
    console.log("🚀 Starting Multi-Campaign LTV Attribution Test...\n");

    const orgId = `org_${createId()}`;
    const campaignAId = `camp_a_${createId()}`;
    const campaignBId = `camp_b_${createId()}`;
    const productId = `prod_${createId()}`;
    const customerId = `cust_${createId()}`;

    try {
        // ===================================================================
        // SETUP: Organization, Product, and Inventory
        // ===================================================================
        console.log("1. Setting up organization and product...");
        await db.insert(organizations).values({
            id: orgId,
            name: "Multi-Campaign Test Org",
            slug: `multi-ltv-${createId()}`,
            pricingVersion: "v1",
            basePrice: 2000,
        });

        await db.insert(products).values({
            id: productId,
            organizationId: orgId,
            name: "Test Liquor",
            sku: `SKU_${createId().substring(0, 6)}`,
            basePrice: 5000,
            currentStockQuantity: 100,
            currentFIFOCost: 3000,
        });

        // Mock PO for FIFO batch
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

        await db.insert(purchaseOrderItems).values({
            id: `poi_${createId()}`,
            purchaseOrderId: poId,
            productId: productId,
            quantityOrdered: 100,
            quantityReceived: 100,
            unitCost: 3000,
            lineTotal: 300000,
            quantityRemaining: 100,
            status: "received",
        });

        // ===================================================================
        // CAMPAIGN A: January Campaign
        // ===================================================================
        console.log("\n2. Creating Campaign A (January)...");
        await db.insert(campaigns).values({
            id: campaignAId,
            organizationId: orgId,
            name: "January Flash Sale",
            type: "flash_sale",
            status: "active",
            messageTemplate: "10% off in January!",
            platforms: ["whatsapp"],
            offerType: "percentage_discount",
            offerValue: 10,
        });

        // ===================================================================
        // CUSTOMER: Opt-in to Campaign A
        // ===================================================================
        console.log("3. Customer opts into Campaign A...");
        await db.insert(customers).values({
            id: customerId,
            organizationId: orgId,
            phoneNumber: "+254700000001",
            hasOptedIn: true,
            optInCampaignId: campaignAId, // ← Campaign A
            attributedRevenue: 0,
            totalSpend: 0,
        });

        // ===================================================================
        // REDEMPTION 1: Customer redeems from Campaign A
        // ===================================================================
        console.log("4. Customer redeems promo from Campaign A...");
        const promoCodeA = `CAMPAIGN_A_${createId().substring(0, 6)}`;
        await db.insert(promoCodes).values({
            organizationId: orgId,
            campaignId: campaignAId,
            customerId: customerId,
            productId: productId,
            code: promoCodeA,
            discountType: "percentage",
            discountValue: 10, // 10% off 5000 = 500 discount → net = 4500
            expiresAt: new Date(Date.now() + 86400000),
        });

        const redemptionA = await promoCodeService.redeemPromoCode({
            code: promoCodeA,
            quantityRedeemed: 1,
        }, orgId);

        console.log(`   ✅ Redeemed from Campaign A: KES ${redemptionA.netRevenue}`);

        // ===================================================================
        // VERIFY: Campaign A LTV = 4500
        // ===================================================================
        console.log("\n5. Verifying Campaign A LTV (should be 4500)...");
        const analysisA1 = await campaignService.getCampaignLtvAnalysis(campaignAId, orgId);

        console.log(`   Campaign A Cohort Size: ${analysisA1.cohortSize}`);
        console.log(`   Campaign A Total LTV: ${analysisA1.totalCohortLTV}`);
        console.log(`   Campaign A Attributed Revenue: ${analysisA1.totalAttributedRevenue}`);

        if (analysisA1.totalCohortLTV !== 4500) {
            throw new Error(`❌ Campaign A LTV should be 4500, got ${analysisA1.totalCohortLTV}`);
        }
        console.log("   ✅ Campaign A LTV = 4500 (correct)");

        // ===================================================================
        // CAMPAIGN B: February Campaign
        // ===================================================================
        console.log("\n6. Creating Campaign B (February)...");
        await db.insert(campaigns).values({
            id: campaignBId,
            organizationId: orgId,
            name: "February Valentine's Sale",
            type: "flash_sale",
            status: "active",
            messageTemplate: "15% off for Valentine's!",
            platforms: ["whatsapp"],
            offerType: "percentage_discount",
            offerValue: 15,
        });

        // ===================================================================
        // CRITICAL: Update customer optInCampaignId to Campaign B
        // This simulates the customer joining a second campaign
        // ===================================================================
        console.log("7. Customer now opts into Campaign B (optInCampaignId changes)...");
        await db.update(customers)
            .set({ optInCampaignId: campaignBId }) // ← OVERWRITES Campaign A
            .where(eq(customers.id, customerId));

        // ===================================================================
        // REDEMPTION 2: Customer redeems from Campaign B
        // ===================================================================
        console.log("8. Customer redeems promo from Campaign B...");
        const promoCodeB = `CAMPAIGN_B_${createId().substring(0, 6)}`;
        await db.insert(promoCodes).values({
            organizationId: orgId,
            campaignId: campaignBId,
            customerId: customerId,
            productId: productId,
            code: promoCodeB,
            discountType: "percentage",
            discountValue: 15, // 15% off 5000 = 750 discount → net = 4250
            expiresAt: new Date(Date.now() + 86400000),
        });

        const redemptionB = await promoCodeService.redeemPromoCode({
            code: promoCodeB,
            quantityRedeemed: 1,
        }, orgId);

        console.log(`   ✅ Redeemed from Campaign B: KES ${redemptionB.netRevenue}`);

        // ===================================================================
        // CRITICAL VERIFICATION: Campaign A LTV should STILL be 4500
        // (Not corrupted by the optInCampaignId change)
        // ===================================================================
        console.log("\n9. 🔥 CRITICAL TEST: Verifying Campaign A LTV is still accurate...");
        const analysisA2 = await campaignService.getCampaignLtvAnalysis(campaignAId, orgId);

        console.log(`   Campaign A Cohort Size: ${analysisA2.cohortSize}`);
        console.log(`   Campaign A Total LTV: ${analysisA2.totalCohortLTV}`);

        if (analysisA2.totalCohortLTV !== 4500) {
            throw new Error(
                `❌ BUG DETECTED: Campaign A LTV changed when customer joined Campaign B!\n` +
                `   Expected: 4500\n` +
                `   Got: ${analysisA2.totalCohortLTV}\n` +
                `   This means the LTV query is still using customers.optInCampaignId (wrong)`
            );
        }
        console.log("   ✅ Campaign A LTV = 4500 (unchanged, correct!)");

        // ===================================================================
        // VERIFY: Campaign B LTV = 4250
        // ===================================================================
        console.log("\n10. Verifying Campaign B LTV (should be 4250)...");
        const analysisB = await campaignService.getCampaignLtvAnalysis(campaignBId, orgId);

        console.log(`   Campaign B Cohort Size: ${analysisB.cohortSize}`);
        console.log(`   Campaign B Total LTV: ${analysisB.totalCohortLTV}`);

        if (analysisB.totalCohortLTV !== 4250) {
            throw new Error(`❌ Campaign B LTV should be 4250, got ${analysisB.totalCohortLTV}`);
        }
        console.log("   ✅ Campaign B LTV = 4250 (correct)");

        // ===================================================================
        // VERIFY: Customer global attributedRevenue = 8750 (4500 + 4250)
        // ===================================================================
        console.log("\n11. Verifying customer's global attributedRevenue...");
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, customerId),
        });

        console.log(`   Customer Total Spend: ${customer?.totalSpend}`);
        console.log(`   Customer Attributed Revenue: ${customer?.attributedRevenue}`);

        const expectedGlobalRevenue = 4500 + 4250; // Sum of both campaigns
        if (customer?.attributedRevenue !== expectedGlobalRevenue) {
            throw new Error(
                `❌ Customer attributedRevenue should be ${expectedGlobalRevenue}, got ${customer?.attributedRevenue}`
            );
        }
        console.log(`   ✅ Customer attributedRevenue = ${expectedGlobalRevenue} (4500 + 4250, correct!)`);

        // ===================================================================
        // FINAL SUMMARY
        // ===================================================================
        console.log("\n" + "=".repeat(70));
        console.log("✅ SUCCESS: Multi-Campaign LTV Attribution Test PASSED!");
        console.log("=".repeat(70));
        console.log("\n📊 Summary:");
        console.log(`   Campaign A (January):   KES ${analysisA2.totalCohortLTV}`);
        console.log(`   Campaign B (February):  KES ${analysisB.totalCohortLTV}`);
        console.log(`   Customer Global Total:  KES ${customer?.attributedRevenue}`);
        console.log("\n✅ Campaigns remain isolated (no cross-contamination)");
        console.log("✅ Customer attributedRevenue accumulates correctly (global)");
        console.log("✅ optInCampaignId change did NOT corrupt Campaign A's LTV(historical cohort LTV)");
        console.log("\n🎯 The fix is working correctly!");

    } catch (error) {
        console.error("\n" + "=".repeat(70));
        console.error("❌ TEST FAILED:");
        console.error("=".repeat(70));
        console.error(error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();
