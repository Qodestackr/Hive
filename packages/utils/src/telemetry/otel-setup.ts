import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const resource = resourceFromAttributes({
	[ATTR_SERVICE_NAME]: "promco-backend",
	[ATTR_SERVICE_VERSION]: "1.0.0",
});

const sdk = new NodeSDK({
	resource,
	instrumentations: [
		getNodeAutoInstrumentations({
			// Disable noisy instrumentations
			"@opentelemetry/instrumentation-fs": {
				enabled: false,
			},
			"@opentelemetry/instrumentation-net": {
				enabled: false,
			},
		}),
	],
	// Export traces to console for development
	traceExporter: new ConsoleSpanExporter(),
});

sdk.start();

console.log("🔥 OTEL instrumentation started successfully");

const shutdown = () => {
	sdk
		.shutdown()
		.then(() => console.log("✅ OTEL terminated"))
		.catch((error) => console.log("❌ Error terminating OTEL", error))
		.finally(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { sdk };
