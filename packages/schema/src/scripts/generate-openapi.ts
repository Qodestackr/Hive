import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";

// Import to extend zod
import "../zod-extend";

// Import all endpoint registrations
import "../endpoints/user";

// Week 1: FIFO + Profit Core endpoints
import "../endpoints/purchase-orders";
import "../endpoints/inventory";
import "../endpoints/campaigns";
import "../endpoints/promo-codes";

// Import the registry
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

// ES modules way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = join(__dirname, "../../generated");
const outputFile = join(outputDir, "openapi.json");

// Ensure directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

writeFileSync(outputFile, JSON.stringify(spec, null, 2));

console.log("✅ OpenAPI spec generated at schema/generated/openapi.json");