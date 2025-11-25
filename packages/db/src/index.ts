import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './schema';

// Get database URL from environment
const DB_URL = "postgresql://neondb_owner:npg_msc8tYpAgLy2@ep-morning-forest-agdffhhz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const databaseUrl = process.env.DATABASE_URL || DB_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Configure WebSocket for serverless driver
neonConfig.webSocketConstructor = ws;

// Create Neon Pool
const pool = new Pool({ connectionString: databaseUrl });

// Create Drizzle instance with schema
const db = drizzle(pool, { schema });

// Export the database instance as default
export default db;

// Also export the schema for direct access
export { schema };

// Export all schema types and tables for convenience
export * from './schema';
export * from './enums';

// Export current-schema (for backward compatibility)
export * as currentSchema from './current-schema';

// Export database utilities
export { withDbOperation, withTransaction } from './with-db-operation';
export type { DbOperationContext } from './with-db-operation';
export { withDrizzleErrors, handleDrizzleError } from './handle-drizzle-error';

// Re-export drizzle-orm helpers for services layer
// Services can import these without adding drizzle-orm as dependency
export { eq, and, or, sql, desc, asc, isNull, isNotNull, inArray, notInArray, sum, count, ilike, gte, lte } from 'drizzle-orm';
export type { SQL } from 'drizzle-orm';
