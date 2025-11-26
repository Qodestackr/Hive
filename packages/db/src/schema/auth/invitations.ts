import { createId } from "@paralleldrive/cuid2";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { teams } from "./teams";

export const invitations = pgTable(
	"invitation",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		email: text("email").notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		inviterId: text("inviter_id").notNull(), // member.id
		role: text("role").notNull().default("member"),
		status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired

		// Lifecycle timestamps
		expiresAt: timestamp("expires_at").notNull(),
		acceptedAt: timestamp("accepted_at"),
		rejectedAt: timestamp("rejected_at"),

		// Teams support (optional)
		teamId: text("team_id").references(() => teams.id, {
			onDelete: "set null",
		}), // Reference to team if invitation is for a specific team

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("invitation_email_org_idx").on(table.email, table.organizationId),
		index("invitation_status_idx").on(table.status),
		index("invitation_org_idx").on(table.organizationId),
	],
);

export type Invitation = typeof invitations.$inferSelect;
