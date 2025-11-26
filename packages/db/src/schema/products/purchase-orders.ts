import { createId } from "@paralleldrive/cuid2";
import {
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "../auth/organizations";
import { products } from "./products";

export const purchaseOrders = pgTable(
	"purchase_order",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// PO details
		poNumber: text("po_number").notNull(),
		supplierName: text("supplier_name"),
		supplierContact: text("supplier_contact"),

		status: text("status").notNull().default("draft"),

		orderDate: timestamp("order_date").notNull(),
		receivedDate: timestamp("received_date"),

		// Financials
		totalCost: real("total_cost").notNull(),
		currency: text("currency").notNull().default("KES"),

		// Metadata
		notes: text("notes"),
		metadata: jsonb("metadata").$type<Record<string, any>>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("purchase_order_org_po_number_idx").on(
			table.organizationId,
			table.poNumber,
		),
		index("purchase_order_org_idx").on(table.organizationId),
		index("purchase_order_status_idx").on(table.status),
		index("purchase_order_order_date_idx").on(table.orderDate),
	],
);

export const purchaseOrderItems = pgTable(
	"purchase_order_item",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		purchaseOrderId: text("purchase_order_id")
			.notNull()
			.references(() => purchaseOrders.id, { onDelete: "cascade" }),
		productId: text("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),

		// Quantity tracking
		quantityOrdered: integer("quantity_ordered").notNull(),
		quantityReceived: integer("quantity_received").default(0),

		// THE GOLD: Unit cost at purchase time
		unitCost: real("unit_cost").notNull(),

		// Batch tracking
		batchNumber: text("batch_number"),
		expiryDate: timestamp("expiry_date"),

		// Calculated
		lineTotal: real("line_total").notNull(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("purchase_order_item_po_idx").on(table.purchaseOrderId),
		index("purchase_order_item_product_idx").on(table.productId),
		index("purchase_order_item_batch_idx").on(table.batchNumber),
		index("purchase_order_item_expiry_idx").on(table.expiryDate),
		// Composite index for FIFO queries (oldest batches first)
		index("purchase_order_item_product_created_idx").on(
			table.productId,
			table.createdAt,
		),
	],
);
