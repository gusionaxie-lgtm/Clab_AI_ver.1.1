import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { scenariosTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

const SCENARIO_PROMPTS: Record<string, string> = {
  viral_growth: "Analyze the viral growth scenario: token goes viral on social media within 72 hours. What are the probability, key factors for success, potential risks, and mitigation strategies? Be highly specific and analytical.",
  slow_organic: "Analyze the slow organic growth scenario: token builds a genuine community over 3-6 months. What factors determine success or failure, and what strategy should be followed?",
  failure: "Analyze the failure scenario: token fails to gain traction within 30 days. Be honest and specific about the most likely reasons for failure and what could have prevented it.",
  copycat_attack: "Analyze the copycat attack scenario: a competitor clones the concept and launches with more capital. How does the original project survive and differentiate?",
  low_budget: "Analyze the low budget launch scenario (under $1,000 total budget). What is realistic to achieve, what should be prioritized, and what are the key risks?",
  hype_collapse: "Analyze the hype cycle collapse scenario: the token gets early viral attention but then experiences a sharp 80%+ price drop. What should the team do to survive and rebuild?",
};

const SCENARIO_TITLES: Record<string, string> = {
  viral_growth: "Viral Growth Scenario",
  slow_organic: "Slow Organic Growth",
  failure: "Failure Case Analysis",
  copycat_attack: "Copycat Attack Defense",
  low_budget: "Low-Budget Launch",
  hype_collapse: "Hype Cycle Collapse",
};

router.get("/scenarios", requireAuth, async (req: any, res) => {
  try {
    const projectId = Number(req.query.projectId);
    if (!projectId) return res.status(400).json({ error: "projectId required" });

    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, req.userId)))
      .limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const scenarios = await db.select().from(scenariosTable).where(eq(scenariosTable.projectId, projectId));
    res.json(scenarios.map(s => ({
      ...s,
      keyFactors: s.keyFactors as string[],
      mitigations: s.mitigations as string[],
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list scenarios");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/scenarios", requireAuth, async (req: any, res) => {
  try {
    const { projectId, scenarioType } = req.body;
    
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, req.userId)))
      .limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const prompt = SCENARIO_PROMPTS[scenarioType] ?? "Analyze this launch scenario.";
    const projectContext = `Project Idea: ${project.idea}. Name: ${project.name ?? "TBD"}. Ticker: ${project.ticker ?? "TBD"}. Narrative: ${project.narrative ?? "Not defined yet"}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are a MemeCoin Launch Strategist for the Four.meme + BNB Chain ecosystem. You provide honest, analytical, structured analysis. No hype, no guarantees. Return a JSON object with: probability (0-1), timeline (string or null), outcome (2-3 sentence summary), keyFactors (array of 4-6 specific strings), mitigations (array of 3-5 actionable strings).`,
        },
        {
          role: "user",
          content: `${projectContext}\n\n${prompt}`,
        },
      ],
    });

    let analysisData: any = {
      probability: 0.3,
      timeline: "30-90 days",
      outcome: "Scenario analysis generated.",
      keyFactors: ["Community building", "Marketing strategy", "Token utility", "Timing"],
      mitigations: ["Focus on fundamentals", "Build community first", "Plan for volatility"],
    };

    try {
      const content = response.choices[0]?.message?.content ?? "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      }
    } catch {
    }

    const [scenario] = await db.insert(scenariosTable).values({
      projectId,
      scenarioType,
      title: SCENARIO_TITLES[scenarioType] ?? scenarioType,
      probability: analysisData.probability ?? 0.3,
      timeline: analysisData.timeline ?? null,
      outcome: analysisData.outcome ?? "Analysis complete.",
      keyFactors: analysisData.keyFactors ?? [],
      mitigations: analysisData.mitigations ?? [],
      outputData: analysisData,
    }).returning();

    res.status(201).json({
      ...scenario,
      keyFactors: scenario.keyFactors as string[],
      mitigations: scenario.mitigations as string[],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create scenario");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/scenarios/:id", requireAuth, async (req: any, res) => {
  try {
    const [scenario] = await db.select().from(scenariosTable)
      .where(eq(scenariosTable.id, Number(req.params.id)))
      .limit(1);
    if (!scenario) return res.status(404).json({ error: "Scenario not found" });
    res.json({ ...scenario, keyFactors: scenario.keyFactors as string[], mitigations: scenario.mitigations as string[] });
  } catch (err) {
    req.log.error({ err }, "Failed to get scenario");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/scenarios/:id", requireAuth, async (req: any, res) => {
  try {
    await db.delete(scenariosTable).where(eq(scenariosTable.id, Number(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete scenario");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
