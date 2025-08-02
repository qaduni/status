import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const statusChecks = pgTable("status_checks", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull(),
  status: text("status").notNull(), // 'online', 'offline', 'slow'
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // in milliseconds
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export const insertWebsiteSchema = createInsertSchema(websites).omit({
  id: true,
  createdAt: true,
});

export const insertStatusCheckSchema = createInsertSchema(statusChecks).omit({
  id: true,
  checkedAt: true,
});

export type Website = typeof websites.$inferSelect;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type StatusCheck = typeof statusChecks.$inferSelect;
export type InsertStatusCheck = z.infer<typeof insertStatusCheckSchema>;

export interface WebsiteWithStatus extends Website {
  lastCheck?: StatusCheck;
  uptime?: number;
  recentChecks?: StatusCheck[];
}
