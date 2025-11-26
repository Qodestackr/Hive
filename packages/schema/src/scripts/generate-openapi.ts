import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";

import "../zod-extend";

import "../endpoints/user";

import "../endpoints/purchase-orders";
import "../endpoints/inventory";
import "../endpoints/campaigns";
import "../endpoints/promo-codes";
import "../endpoints/products";
import "../endpoints/customers";
import "../endpoints/reconciliation";
import "../endpoints/dashboard";
import "../endpoints/billing";
import "../endpoints/profit-alerts";

import { registry } from "../openapi-registry.js";

const generator = new OpenApiGeneratorV31(registry.definitions);

const spec = generator.generateDocument({
	openapi: "3.1.0",
	info: {
		title: "Promco API",
		version: "1.0.0",
		description: "Auto-generated OpenAPI from Zod schemas",
	},
	servers: [
		{
			url: "http://localhost:3000",
			description: "Development server",
		},
	],
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = join(__dirname, "../../generated");
const outputFile = join(outputDir, "openapi.json");

if (!existsSync(outputDir)) {
	mkdirSync(outputDir, { recursive: true });
}

writeFileSync(outputFile, JSON.stringify(spec, null, 2));

console.log("✅ OpenAPI spec generated at schema/generated/openapi.json");
