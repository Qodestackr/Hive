import type { Metadata } from "next/types";
import { APP_BASE_URL } from "@repo/utils"

export function createMetadata(override: Metadata): Metadata {

  return {
    ...override,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: APP_BASE_URL,
      images: `${APP_BASE_URL}/og.png`,
      siteName: "Promco",
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: "@Qodestackr",
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: `${APP_BASE_URL}/og.png`,
      ...override.twitter,
    },
  };
}

export const baseUrl =
  process.env.NODE_ENV === "development"
    ? new URL("http://localhost:3000")
    : new URL(APP_BASE_URL);
