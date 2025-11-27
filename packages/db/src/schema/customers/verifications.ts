import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { customers } from "./customers";

/**
 * Customer Age Verifications
 * 
 * Tracks age verification status for B2C customers (alcohol sales require 18+)
 * 
 * Verification methods:
 * - ID number (Kenya National ID)
 * - Date of birth
 * - Manual verification by staff
 */
export const customerVerifications = pgTable("customer_verifications", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Link to customer
    customerId: uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "cascade" }),

    // Verification status
    verified: boolean("verified").notNull().default(false),
    verifiedAt: timestamp("verified_at"),
    verificationMethod: text("verification_method"), // "id_number", "dob", "manual"

    // Age data
    dateOfBirth: timestamp("date_of_birth"),
    age: integer("age"), // Calculated from DOB

    // ID verification (Kenya National ID)
    idNumber: text("id_number"),
    idVerified: boolean("id_verified").default(false),

    // Metadata
    verificationNotes: text("verification_notes"), // Why/how verified
    verifiedBy: uuid("verified_by"), // Staff member who verified (if manual)

    // Additional data (for future: photo of ID, etc.)
    metadata: jsonb("metadata").$type<{
        ipAddress?: string;
        userAgent?: string;
        photoUrl?: string; // ID photo for compliance
    }>(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
    // Indexes for fast lookups
    { name: "idx_customer_verifications_customer_id", columns: [table.customerId] },
    { name: "idx_customer_verifications_verified", columns: [table.verified] },
    { name: "idx_customer_verifications_id_number", columns: [table.idNumber] },
]);
