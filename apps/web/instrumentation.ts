import * as traceloop from "@traceloop/node-server-sdk";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        traceloop.initialize({
            appName: "promco-web",
            disableBatch: true,
        });
    }
}
