import db from "@repo/db";
import { type BusinessType, InventoryImportMethod } from "@repo/db/enums";
/**
 * Maps user roles to business types
 * This is used during organization creation to set default business type
 */
export const mapUserRoleToBusiness = (role: string): BusinessType => {
	switch (role.toUpperCase()) {
		case "DISTRIBUTOR":
			return "DISTRIBUTOR";
		case "WHOLESALER":
			return "WHOLESALER";
		case "RETAILER":
			return "RETAILER";
		default:
			return "RETAILER";
	}
};

/**
 * Complete the organization onboarding process
 */
export const completeOnboarding = async (
	organizationId: string,
	data: {
		businessType?: BusinessType;
		description?: string;
		logo?: string;
		city?: string;
		address?: string;
		phoneNumber?: string;
		enableSMS?: boolean;
		paymentMethod?: string;
		subscriptionPlan?: string;
		warehouseName?: string;
		inventoryImportMethod?: string;
	},
) => {
	try {
		await db.organization.update({
			where: { id: organizationId },
			data: {
				businessType: data.businessType as BusinessType,
				description: data.description,
				logo: data.logo,
				city: data.city,
				address: data.address,
				phoneNumber: data.phoneNumber,
				enableSMS: data.enableSMS,
				paymentMethod: data.paymentMethod as any,
				subscriptionPlan: data.subscriptionPlan as any,
				onboardingComplete: true,
			},
		});

		// Set inventory import preference
		if (data.inventoryImportMethod) {
			await db.onboardingPreference.upsert({
				where: { organizationId },
				update: {
					importMethod: InventoryImportMethod.API,
				},
				create: {
					organizationId,
					importMethod: InventoryImportMethod.API,
				},
			});
		}

		return { success: true };
	} catch (error) {
		console.error("Error completing onboarding:", error);
		return { success: false, error };
	}
};
