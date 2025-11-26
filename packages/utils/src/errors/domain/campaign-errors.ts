import { Data } from "effect";
import { ErrorCode } from "../error";

export class CampaignNotFound extends Data.TaggedError("CampaignNotFound")<{
	readonly campaignId: string;
	readonly organizationId: string;
}> {
	readonly errorCode = ErrorCode.RECORD_NOT_FOUND;
	readonly statusCode = 404;

	get message() {
		return `Campaign '${this.campaignId}' not found`;
	}
}

export type CampaignError = CampaignNotFound;
