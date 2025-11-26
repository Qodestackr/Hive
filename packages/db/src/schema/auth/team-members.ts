import { createId } from "@paralleldrive/cuid2";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { teams } from "./teams";

export const teamMembers = pgTable(
	"team_member",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		userId: text("user_id").notNull(), // References Better Auth user

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("team_member_user_team_idx").on(table.userId, table.teamId),
		index("team_member_team_idx").on(table.teamId),
		index("team_member_user_idx").on(table.userId),
	],
);
