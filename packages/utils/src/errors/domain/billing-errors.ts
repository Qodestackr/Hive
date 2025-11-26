import { Data } from "effect";

export class InvoiceNotFound extends Data.TaggedError("InvoiceNotFound")<{
	invoiceId: string;
}> {
	get message() {
		return `Invoice not found: ${this.invoiceId}`;
	}
}
