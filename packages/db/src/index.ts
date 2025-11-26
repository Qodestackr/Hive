import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

const DB_URL =
	"postgresql://neondb_owner:npg_msc8tYpAgLy2@ep-morning-forest-agdffhhz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const databaseUrl = process.env.DATABASE_URL || DB_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL environment variable is not set");
}

// Configure WebSocket for serverless driver
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: databaseUrl });

const db = drizzle(pool, { schema });

export default db;

export { schema };

export type { SQL } from "drizzle-orm";

export {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	lte,
	notInArray,
	or,
	sql,
	sum,
} from "drizzle-orm";

export * from "./enums";
export { handleDrizzleError, withDrizzleErrors } from "./handle-drizzle-error";

export * from "./schema";
export type { DbOperationContext } from "./with-db-operation";
export { withDbOperation, withTransaction } from "./with-db-operation";
