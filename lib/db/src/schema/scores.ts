import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scoresTable = pgTable("scores", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  launchPotential: real("launch_potential").notNull(),
  originality: real("originality").notNull(),
  memeStrength: real("meme_strength").notNull(),
  survivability: real("survivability").notNull(),
  riskScore: real("risk_score").notNull(),
  communityPotential: real("community_potential").notNull(),
  executionDifficulty: real("execution_difficulty").notNull(),
  analysis: text("analysis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScoreSchema = createInsertSchema(scoresTable).omit({ id: true, createdAt: true });
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scoresTable.$inferSelect;
