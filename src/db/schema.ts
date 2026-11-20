import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Master Owner (role = "owner") has supreme control over everything.
 * Resellers / sub-users (role = "reseller") can only generate + view their own keys.
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("reseller"), // "owner" | "reseller"
  active: boolean("active").notNull().default(true),
  /** null = unlimited key generation. Owner is always unlimited. */
  maxKeys: integer("max_keys"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const licenses = pgTable("licenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  plan: text("plan").notNull(), // "3d" | "1m" | "3m"
  days: integer("days").notNull(),
  deviceId: text("device_id"),
  customer: text("customer").notNull().default(""),
  note: text("note").notNull().default(""),
  /** "active" | "revoked"  (expiry is computed from expires_at) */
  status: text("status").notNull().default("active"),
  issuedBy: uuid("issued_by").references(() => users.id, { onDelete: "set null" }),
  activatedAt: timestamp("activated_at", { mode: "date" }),
  lastSeenAt: timestamp("last_seen_at", { mode: "date" }),
  activations: integer("activations").notNull().default(0),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const activity = pgTable("activity", {
  id: serial("id").primaryKey(),
  at: timestamp("at", { mode: "date" }).defaultNow().notNull(),
  actor: text("actor").notNull().default("system"),
  action: text("action").notNull(),
  detail: text("detail").notNull().default(""),
});
