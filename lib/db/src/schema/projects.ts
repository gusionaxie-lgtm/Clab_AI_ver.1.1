import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  idea: text("idea").notNull(),
  name: text("name"),
  ticker: text("ticker"),
  narrative: text("narrative"),
  lore: text("lore"),
  roadmap: text("roadmap"),
  brandVoice: text("brand_voice"),
  launchThread: text("launch_thread"),
  faq: text("faq"),
  riskReport: text("risk_report"),
  conversationId: integer("conversation_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
