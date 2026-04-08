import { createId } from "@paralleldrive/cuid2";
import {
  pgTable,
  text,
  real,
  jsonb,
  vector,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "../auth/organizations";

// Enum for ruleType
const ruleTypeEnum = pgEnum("rule_type", [
  "hard_constraint",
  "soft_preference",
  "correction",
]);

// “Hey! I’ve looked at your liquor promotions data and drafted some light assumptions. 
// Everything is editable and fully under your control.”
export const aiKnowledgeBaseEntries = pgTable(
  "ai_knowledge_base_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    ruleType: ruleTypeEnum("rule_type").notNull(),

    content: text("content").notNull(),
    normalizedContent: text("normalized_content"),

    confidence: real("confidence").notNull().default(0.5),

    embedding: vector("embedding", { dimensions: 1536 }),

    tags: text("tags").array().default([]),

    source: text("source").notNull(), // agent_feedback | human_feedback | eval | system

    metadata: jsonb("metadata").$type<Record<string, any>>(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("ai_kb_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
    index("ai_kb_org_idx").on(table.organizationId),
  ]
);

export type AIKnowledgeBaseEntry = typeof aiKnowledgeBaseEntries.$inferSelect;