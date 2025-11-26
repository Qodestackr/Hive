import { createId } from "@paralleldrive/cuid2";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const teams = pgTable(
	"team",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		name: text("name").notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Flexible metadata storage
		metadata: jsonb("metadata").$type<Record<string, any>>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("team_org_idx").on(table.organizationId),
		index("team_name_org_idx").on(table.name, table.organizationId),
	],
);
