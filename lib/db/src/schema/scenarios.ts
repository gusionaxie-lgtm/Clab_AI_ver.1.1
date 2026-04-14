import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scenariosTable = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  scenarioType: text("scenario_type").notNull(),
  title: text("title").notNull(),
  probability: real("probability").notNull(),
  timeline: text("timeline"),
  outcome: text("outcome").notNull(),
  keyFactors: jsonb("key_factors").notNull().$type<string[]>(),
  mitigations: jsonb("mitigations").notNull().$type<string[]>(),
  outputData: jsonb("output_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScenarioSchema = createInsertSchema(scenariosTable).omit({ id: true, createdAt: true });
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenariosTable.$inferSelect;
