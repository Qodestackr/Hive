import { createId } from "@paralleldrive/cuid2";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const members = pgTable(
	"member",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id").notNull(), // References Better Auth user
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		role: text("role").notNull().default("member"), // owner, admin, member

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("member_user_org_idx").on(table.userId, table.organizationId),
		index("member_org_idx").on(table.organizationId),
	],
);

export type Member = typeof members.$inferSelect;
