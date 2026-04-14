import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { projectsTable, scoresTable, scenariosTable, profilesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/projects", requireAuth, async (req: any, res) => {
  try {
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.userId, req.userId))
      .orderBy(desc(projectsTable.createdAt));
    res.json(projects);
  } catch (err) {
    req.log.error({ err }, "Failed to list projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects", requireAuth, async (req: any, res) => {
  try {
    const { idea, name, ticker } = req.body;
    const [project] = await db.insert(projectsTable)
      .values({ userId: req.userId, idea, name, ticker })
      .returning();
    res.status(201).json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to create project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId)))
      .limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const [scores] = await db.select().from(scoresTable).where(eq(scoresTable.projectId, id)).limit(1);
    const scenarios = await db.select().from(scenariosTable).where(eq(scenariosTable.projectId, id));

    res.json({
      ...project,
      scores: scores ?? null,
      scenarios: scenarios.map(s => ({ ...s, keyFactors: s.keyFactors as string[], mitigations: s.mitigations as string[] })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/projects/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const { idea, name, ticker, narrative, lore, roadmap, brandVoice, launchThread, faq, riskReport } = req.body;
    
    const [updated] = await db.update(projectsTable)
      .set({ idea, name, ticker, narrative, lore, roadmap, brandVoice, launchThread, faq, riskReport, updatedAt: new Date() })
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/projects/:id", requireAuth, async (req: any, res) => {
  try {
    await db.delete(projectsTable)
      .where(and(eq(projectsTable.id, Number(req.params.id)), eq(projectsTable.userId, req.userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:id/scores", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId))).limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const [scores] = await db.select().from(scoresTable).where(eq(scoresTable.projectId, id)).limit(1);
    if (!scores) return res.status(404).json({ error: "Scores not found" });
    res.json(scores);
  } catch (err) {
    req.log.error({ err }, "Failed to get scores");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/scores", requireAuth, async (req: any, res) => {
  try {
    const projectId = Number(req.params.id);
    const { launchPotential, originality, memeStrength, survivability, riskScore, communityPotential, executionDifficulty, analysis } = req.body;

    const existing = await db.select().from(scoresTable).where(eq(scoresTable.projectId, projectId)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(scoresTable)
        .set({ launchPotential, originality, memeStrength, survivability, riskScore, communityPotential, executionDifficulty, analysis })
        .where(eq(scoresTable.projectId, projectId))
        .returning();
      return res.status(201).json(updated);
    }
    
    const [scores] = await db.insert(scoresTable)
      .values({ projectId, launchPotential, originality, memeStrength, survivability, riskScore, communityPotential, executionDifficulty, analysis })
      .returning();
    res.status(201).json(scores);
  } catch (err) {
    req.log.error({ err }, "Failed to save scores");
    res.status(500).json({ error: "Internal server error" });
  }
});

const SYSTEM_PROMPT = `You are a MemeCoin Launch Strategist specializing in the Four.meme + BNB Chain ecosystem. You are analytical, structured, and honest. You critically evaluate ideas - you do NOT give empty praise. You provide structured outputs in JSON format. Never make financial promises or profit guarantees. Focus on strategy, execution, and probability-based insights.`;

router.post("/projects/:id/generate", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const { contentType } = req.body;

    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId))).limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)).limit(1);

    const projectContext = `
Project Idea: ${project.idea}
Name: ${project.name ?? "Not set"}
Ticker: ${project.ticker ?? "Not set"}
Narrative: ${project.narrative ?? "Not set"}
Lore: ${project.lore ?? "Not set"}
${profile ? `Creator Profile: Budget: ${profile.budget}, Risk Level: ${profile.riskLevel}, Target Audience: ${profile.audience}, Timeline: ${profile.timeline}, Creator Type: ${profile.creatorType}` : ""}
    `.trim();

    type ContentRequest = {
      instruction: string;
      returnType: string;
    };

    const contentRequests: Record<string, ContentRequest> = {
      name: {
        instruction: "Generate 5 creative, memorable meme coin names for this project. Return JSON: { content: 'formatted list of 5 names with explanations' }",
        returnType: "names",
      },
      ticker: {
        instruction: "Generate 5 potential ticker symbols (3-5 characters) for this meme coin. Return JSON: { content: 'formatted list of 5 tickers with reasoning' }",
        returnType: "tickers",
      },
      lore: {
        instruction: "Create a compelling origin story / lore for this meme coin that will resonate with crypto Twitter. 2-3 paragraphs. Return JSON: { content: 'the lore story' }",
        returnType: "lore",
      },
      roadmap: {
        instruction: "Create a realistic 90-day roadmap with 3 phases for this meme coin launch. Be specific and achievable. Return JSON: { content: 'formatted roadmap with phases, milestones, and timelines' }",
        returnType: "roadmap",
      },
      brandVoice: {
        instruction: "Define the brand voice, tone, and communication style for this meme coin project. Include do's and don'ts for community communication. Return JSON: { content: 'brand voice guide' }",
        returnType: "brandVoice",
      },
      launchThread: {
        instruction: "Write an attention-grabbing Twitter/X launch thread (8-10 tweets) for this meme coin. Include hook, story, tokenomics teaser, and CTA. Return JSON: { content: 'full thread with numbered tweets' }",
        returnType: "launchThread",
      },
      faq: {
        instruction: "Create a comprehensive FAQ (10 questions) that addresses common investor concerns about this meme coin project. Be transparent and honest. Return JSON: { content: 'formatted FAQ' }",
        returnType: "faq",
      },
      riskReport: {
        instruction: "Generate a detailed risk analysis report covering market risks, execution risks, technical risks, and community risks. Be honest and thorough. Return JSON: { content: 'risk report' }",
        returnType: "riskReport",
      },
      scores: {
        instruction: `Evaluate this meme coin project and return scores (0-100) for each dimension. Be critical and objective. Return JSON: { content: 'score analysis summary', scores: { launchPotential: number, originality: number, memeStrength: number, survivability: number, riskScore: number, communityPotential: number, executionDifficulty: number, analysis: 'detailed analysis paragraph' } }`,
        returnType: "scores",
      },
    };

    const request = contentRequests[contentType];
    if (!request) return res.status(400).json({ error: "Invalid content type" });

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${projectContext}\n\n${request.instruction}` },
      ],
    });

    const rawContent = response.choices[0]?.message?.content ?? "";
    let parsed: any = { content: rawContent };
    
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
    }

    if (contentType === "scores" && parsed.scores) {
      const { launchPotential, originality, memeStrength, survivability, riskScore, communityPotential, executionDifficulty, analysis } = parsed.scores;
      
      const existing = await db.select().from(scoresTable).where(eq(scoresTable.projectId, id)).limit(1);
      let savedScores;
      
      if (existing.length > 0) {
        const [updated] = await db.update(scoresTable)
          .set({ launchPotential, originality, memeStrength, survivability, riskScore, communityPotential, executionDifficulty, analysis })
          .where(eq(scoresTable.projectId, id))
          .returning();
        savedScores = updated;
      } else {
        const [created] = await db.insert(scoresTable)
          .values({ projectId: id, launchPotential, originality, memeStrength, survivability, riskScore, communityPotential, executionDifficulty, analysis })
          .returning();
        savedScores = created;
      }
      
      return res.json({ contentType, content: parsed.content ?? analysis, scores: savedScores });
    }

    const updateField: Record<string, string> = {
      name: "name",
      lore: "lore",
      roadmap: "roadmap",
      brandVoice: "brandVoice",
      launchThread: "launchThread",
      faq: "faq",
      riskReport: "riskReport",
    };

    if (updateField[contentType]) {
      await db.update(projectsTable)
        .set({ [updateField[contentType]]: parsed.content, updatedAt: new Date() })
        .where(eq(projectsTable.id, id));
    }

    res.json({ contentType, content: parsed.content });
  } catch (err) {
    req.log.error({ err }, "Failed to generate content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:id/export", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId))).limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const [scores] = await db.select().from(scoresTable).where(eq(scoresTable.projectId, id)).limit(1);
    const scenarios = await db.select().from(scenariosTable).where(eq(scenariosTable.projectId, id));

    res.json({
      projectId: project.id,
      projectName: project.name,
      ticker: project.ticker,
      idea: project.idea,
      narrative: project.narrative,
      lore: project.lore,
      roadmap: project.roadmap,
      brandVoice: project.brandVoice,
      launchThread: project.launchThread,
      faq: project.faq,
      riskReport: project.riskReport,
      scores: scores ?? null,
      scenarios: scenarios.map(s => ({ ...s, keyFactors: s.keyFactors as string[], mitigations: s.mitigations as string[] })),
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to export project");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
