import { PutObjectCommand } from "@aws-sdk/client-s3";
import { generateId } from "@repo/utils";
import { BUCKET_NAME, PUBLIC_URL, r2Client } from "./api/r2-storage-client";

export interface UploadResult {
	url: string;
	key: string;
	success: boolean;
	error?: string;
}

export async function uploadImageToR2(
	imageBuffer: Buffer,
	mimeType: string,
	category: "logos" | "products" | "users" | "promotions" = "logos",
): Promise<UploadResult> {
	try {
		const fileExtension = getFileExtension(mimeType);
		const fileName = `${category}/${generateId(8)}.${fileExtension}`;

		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: fileName,
			Body: imageBuffer,
			ContentType: mimeType,
			CacheControl: "public, max-age=31536000",
			Metadata: {
				uploadedAt: new Date().toISOString(),
				category,
			},
		});

		await r2Client.send(command);

		return {
			url: `${PUBLIC_URL}/${fileName}`,
			key: fileName,
			success: true,
		};
	} catch (error) {
		console.error("R2 upload error:", error);
		return {
			url: "",
			key: "",
			success: false,
			error: error instanceof Error ? error.message : "Upload failed",
		};
	}
}

export function getFileExtension(mimeType: string): string {
	const mimeToExt: Record<string, string> = {
		"image/jpeg": "jpg",
		"image/jpg": "jpg",
		"image/png": "png",
		"image/webp": "webp",
		"image/gif": "gif",
		"image/svg+xml": "svg",
	};
	return mimeToExt[mimeType] || "jpg";
}

export function base64ToBuffer(base64String: string): Buffer {
	// Remove data URL prefix if present
	const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, "");
	return Buffer.from(base64Data, "base64");
}
