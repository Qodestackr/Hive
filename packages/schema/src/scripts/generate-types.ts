import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const execAsync = promisify(exec);

// ES modules way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = join(__dirname, "../../generated/openapi.json");
const outputFile = join(__dirname, "../../generated/openapi.ts");

async function generateTypes() {
    // Verify input file exists
    if (!existsSync(inputFile)) {
        console.error("❌ OpenAPI spec not found. Run 'bun run generate:openapi' first.");
        process.exit(1);
    }

    console.log("🔄 Generating TypeScript types from OpenAPI spec...");

    try {
        // Run openapi-typescript via npx
        const command = `npx openapi-typescript "${inputFile}" --output "${outputFile}"`;

        const { stdout, stderr } = await execAsync(command);

        if (stderr && !stderr.includes("Successfully")) {
            console.warn("⚠️  Warnings:", stderr);
        }

        if (stdout) {
            console.log(stdout);
        }

        console.log("✅ TypeScript types generated at packages/schema/generated/openapi.ts");
    } catch (error: any) {
        console.error("❌ Failed to generate types:", error.message);
        process.exit(1);
    }
}

generateTypes();
