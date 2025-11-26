export interface CustomerUpdateMutations {
	customerUpdate: {
		id: string;
		name?: string;
		email?: string;
		phoneNumber?: string;
		tier?: string;
		city?: string;
		tags?: string[];
		customFields?: any;
		updatedAt: Date;
	};
}

export interface OptInMutations {
	customerUpdate: {
		id: string;
		hasOptedIn: true;
		optInSource: string | null;
		optInCampaignId: string | null;
		optedInAt: Date;
		optedOutAt: null;
		updatedAt: Date;
	};
}

export interface OptOutMutations {
	customerUpdate: {
		id: string;
		hasOptedIn: false;
		optedOutAt: Date;
		updatedAt: Date;
	};
}

export interface AgeVerificationMutations {
	customerUpdate: {
		id: string;
		isAgeVerified: true;
		ageVerificationMethod: string;
		ageVerifiedAt: Date;
		dateOfBirth: Date | null;
		updatedAt: Date;
	};
}

export function buildCustomerUpdateMutations(params: {
	customerId: string;
	updates: {
		name?: string;
		email?: string;
		phoneNumber?: string;
		tier?: string;
		city?: string;
		tags?: string[];
		customFields?: any;
	};
}): CustomerUpdateMutations {
	return {
		customerUpdate: {
			id: params.customerId,
			...params.updates,
			updatedAt: new Date(),
		},
	};
}

export function buildOptInMutations(params: {
	customerId: string;
	optInSource?: string;
	campaignId?: string;
}): OptInMutations {
	return {
		customerUpdate: {
			id: params.customerId,
			hasOptedIn: true,
			optInSource: params.optInSource || null,
			optInCampaignId: params.campaignId || null,
			optedInAt: new Date(),
			optedOutAt: null,
			updatedAt: new Date(),
		},
	};
}

export function buildOptOutMutations(params: {
	customerId: string;
}): OptOutMutations {
	return {
		customerUpdate: {
			id: params.customerId,
			hasOptedIn: false,
			optedOutAt: new Date(),
			updatedAt: new Date(),
		},
	};
}

export function buildAgeVerificationMutations(params: {
	customerId: string;
	verificationMethod: string;
	dateOfBirth?: string;
}): AgeVerificationMutations {
	return {
		customerUpdate: {
			id: params.customerId,
			isAgeVerified: true,
			ageVerificationMethod: params.verificationMethod,
			ageVerifiedAt: new Date(),
			dateOfBirth: params.dateOfBirth ? new Date(params.dateOfBirth) : null,
			updatedAt: new Date(),
		},
	};
}
