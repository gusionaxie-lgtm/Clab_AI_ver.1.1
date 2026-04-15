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

// ---------------------------------------------------------------------------
// Utility: strip markdown artifacts from a plain text string
// ---------------------------------------------------------------------------
function stripMd(text: string): string {
  if (typeof text !== "string") return String(text ?? "");
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")  // bold / italic
    .replace(/#{1,6}\s*/g, "")                  // headers
    .replace(/^\s*[-*+]\s+/gm, "")              // list markers
    .replace(/^\s*\d+\.\s+/gm, "")              // numbered lists
    .replace(/`{1,3}[^`]*`{1,3}/g, "")          // code spans/blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")    // links
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")      // underscores
    .replace(/\n{3,}/g, "\n\n")                 // collapse excessive newlines
    .trim();
}

// ---------------------------------------------------------------------------
// Validate + fallback per content type
// ---------------------------------------------------------------------------
function validateNameIdeas(raw: any): { ideas: { name: string; ticker: string; description: string }[] } {
  const fallback = {
    ideas: [
      { name: "Generation Failed", ticker: "RETRY", description: "The AI returned an invalid response. Please try again." },
    ],
  };
  try {
    const list = Array.isArray(raw?.ideas) ? raw.ideas : Array.isArray(raw?.content) ? raw.content : null;
    if (!list || list.length === 0) return fallback;
    return {
      ideas: list.slice(0, 5).map((item: any) => ({
        name: stripMd(String(item?.name ?? "Unnamed")),
        ticker: String(item?.ticker ?? "???").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6),
        description: stripMd(String(item?.description ?? "")),
      })),
    };
  } catch {
    return fallback;
  }
}

function validateTickerIdeas(raw: any): { ideas: { ticker: string; rationale: string }[] } {
  const fallback = {
    ideas: [{ ticker: "RETRY", rationale: "The AI returned an invalid response. Please try again." }],
  };
  try {
    const list = Array.isArray(raw?.ideas) ? raw.ideas : Array.isArray(raw?.content) ? raw.content : null;
    if (!list || list.length === 0) return fallback;
    return {
      ideas: list.slice(0, 5).map((item: any) => ({
        ticker: String(item?.ticker ?? "???").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6),
        rationale: stripMd(String(item?.rationale ?? "")),
      })),
    };
  } catch {
    return fallback;
  }
}

function validateLore(raw: any): { paragraphs: string[] } {
  const fallback = { paragraphs: ["Generation failed. Please retry."] };
  try {
    const list = Array.isArray(raw?.paragraphs) ? raw.paragraphs : null;
    if (!list || list.length === 0) return fallback;
    return { paragraphs: list.slice(0, 6).map((p: any) => stripMd(String(p))) };
  } catch {
    return fallback;
  }
}

function validateRoadmap(raw: any): { phases: { name: string; weeks: string; milestones: string[] }[] } {
  const fallback = {
    phases: [{ name: "Generation Failed", weeks: "—", milestones: ["Please retry the generation."] }],
  };
  try {
    const list = Array.isArray(raw?.phases) ? raw.phases : null;
    if (!list || list.length === 0) return fallback;
    return {
      phases: list.slice(0, 5).map((p: any) => ({
        name: stripMd(String(p?.name ?? "Phase")),
        weeks: stripMd(String(p?.weeks ?? "")),
        milestones: Array.isArray(p?.milestones)
          ? p.milestones.slice(0, 8).map((m: any) => stripMd(String(m)))
          : [],
      })),
    };
  } catch {
    return fallback;
  }
}

function validateBrandVoice(raw: any): { tone: string; dos: string[]; donts: string[]; phrases: string[] } {
  const fallback = { tone: "Generation failed.", dos: [], donts: [], phrases: [] };
  try {
    return {
      tone: stripMd(String(raw?.tone ?? "Generation failed.")),
      dos: Array.isArray(raw?.dos) ? raw.dos.slice(0, 8).map((s: any) => stripMd(String(s))) : [],
      donts: Array.isArray(raw?.donts) ? raw.donts.slice(0, 8).map((s: any) => stripMd(String(s))) : [],
      phrases: Array.isArray(raw?.phrases) ? raw.phrases.slice(0, 6).map((s: any) => stripMd(String(s))) : [],
    };
  } catch {
    return fallback;
  }
}

function validateLaunchThread(raw: any): { tweets: { number: number; text: string }[] } {
  const fallback = { tweets: [{ number: 1, text: "Generation failed. Please retry." }] };
  try {
    const list = Array.isArray(raw?.tweets) ? raw.tweets : null;
    if (!list || list.length === 0) return fallback;
    return {
      tweets: list.slice(0, 12).map((t: any, i: number) => ({
        number: typeof t?.number === "number" ? t.number : i + 1,
        text: stripMd(String(t?.text ?? "")),
      })),
    };
  } catch {
    return fallback;
  }
}

function validateFaq(raw: any): { items: { question: string; answer: string }[] } {
  const fallback = { items: [{ question: "Generation failed.", answer: "Please retry the generation." }] };
  try {
    const list = Array.isArray(raw?.items) ? raw.items : null;
    if (!list || list.length === 0) return fallback;
    return {
      items: list.slice(0, 12).map((item: any) => ({
        question: stripMd(String(item?.question ?? "Question")),
        answer: stripMd(String(item?.answer ?? "")),
      })),
    };
  } catch {
    return fallback;
  }
}

function validateRiskReport(raw: any): {
  summary: string;
  overallRiskLevel: string;
  risks: { name: string; severity: string; likelihood: string; description: string; mitigation: string }[];
  earlyWarningSignals: string[];
  executionRisks: string[];
} {
  const fallback = {
    summary: "Risk analysis generation failed. Please retry.",
    overallRiskLevel: "Medium",
    risks: [],
    earlyWarningSignals: [],
    executionRisks: [],
  };
  try {
    const data = raw?.content ?? raw;
    if (!data || typeof data !== "object") return fallback;
    const LEVELS = new Set(["High", "Medium", "Low"]);
    return {
      summary: stripMd(String(data.summary ?? fallback.summary)),
      overallRiskLevel: LEVELS.has(data.overallRiskLevel) ? data.overallRiskLevel : "Medium",
      risks: Array.isArray(data.risks)
        ? data.risks.slice(0, 8).map((r: any) => ({
            name: stripMd(String(r?.name ?? "Risk")),
            severity: LEVELS.has(r?.severity) ? r.severity : "Medium",
            likelihood: LEVELS.has(r?.likelihood) ? r.likelihood : "Medium",
            description: stripMd(String(r?.description ?? "")),
            mitigation: stripMd(String(r?.mitigation ?? "")),
          }))
        : [],
      earlyWarningSignals: Array.isArray(data.earlyWarningSignals)
        ? data.earlyWarningSignals.slice(0, 8).map((s: any) => stripMd(String(s)))
        : [],
      executionRisks: Array.isArray(data.executionRisks)
        ? data.executionRisks.slice(0, 8).map((s: any) => stripMd(String(s)))
        : [],
    };
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// CRUD routes
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Generation system prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a MemeCoin Launch Strategist for the Four.meme + BNB Chain ecosystem.
CRITICAL RULES — you must obey ALL of them:
1. Return ONLY valid JSON. No explanations, no preamble, no markdown.
2. No asterisks (*), no pound signs (#), no backticks, no numbered lists in text fields.
3. All text values must be clean plain sentences. No formatting characters whatsoever.
4. Be analytical and honest. Do not give empty praise or make financial promises.`;

// ---------------------------------------------------------------------------
// Content prompts — each one declares the EXACT JSON shape required
// ---------------------------------------------------------------------------
const contentPrompts: Record<string, { instruction: string; schema: string }> = {
  name: {
    schema: '{"ideas":[{"name":"string","ticker":"string","description":"string"}]}',
    instruction: `Generate exactly 5 creative meme coin name ideas for the project described above.
Return ONLY this JSON structure (no other text):
{"ideas":[{"name":"CoinName","ticker":"TICKER","description":"One plain sentence under 20 words explaining the appeal"}]}
Rules: name 2-4 words max. ticker 3-6 uppercase letters only. description is plain text, zero markdown.`,
  },
  ticker: {
    schema: '{"ideas":[{"ticker":"string","rationale":"string"}]}',
    instruction: `Generate exactly 5 ticker symbol options for the meme coin project described above.
Return ONLY this JSON structure:
{"ideas":[{"ticker":"SYMBOL","rationale":"One plain sentence under 20 words explaining why this ticker is memorable"}]}
Rules: ticker 3-6 uppercase letters only, no numbers or special chars. rationale is plain text, zero markdown.`,
  },
  lore: {
    schema: '{"paragraphs":["string","string","string"]}',
    instruction: `Write an origin story / lore for this meme coin that resonates with crypto Twitter.
Return ONLY this JSON structure:
{"paragraphs":["Paragraph one plain text","Paragraph two plain text","Paragraph three plain text"]}
Rules: 3 to 4 paragraphs. Each paragraph is 2-4 plain sentences. Zero asterisks, headers, or list markers.`,
  },
  roadmap: {
    schema: '{"phases":[{"name":"string","weeks":"string","milestones":["string"]}]}',
    instruction: `Create a realistic 90-day roadmap with 3 phases for this meme coin launch.
Return ONLY this JSON structure:
{"phases":[{"name":"Phase 1 Name","weeks":"Weeks 1-30","milestones":["Milestone one","Milestone two","Milestone three"]}]}
Rules: exactly 3 phases. 3-5 milestones per phase. All text values are plain sentences, zero markdown.`,
  },
  brandVoice: {
    schema: '{"tone":"string","dos":["string"],"donts":["string"],"phrases":["string"]}',
    instruction: `Define the brand voice and communication style for this meme coin.
Return ONLY this JSON structure:
{"tone":"Plain description of the tone in 1-2 sentences","dos":["Do this","And this"],"donts":["Avoid this","Never do this"],"phrases":["Example phrase one","Example phrase two"]}
Rules: 5-8 items in dos and donts. 4-6 sample phrases. All text is plain, zero markdown characters.`,
  },
  launchThread: {
    schema: '{"tweets":[{"number":1,"text":"string"}]}',
    instruction: `Write an 8-tweet Twitter/X launch thread for this meme coin. Include hook, story, tokenomics teaser, CTA.
Return ONLY this JSON structure:
{"tweets":[{"number":1,"text":"The tweet text here"},{"number":2,"text":"Next tweet"}]}
Rules: exactly 8 tweets. Each tweet under 280 characters. Plain text only, zero markdown, zero hashtags in first 3 tweets.`,
  },
  faq: {
    schema: '{"items":[{"question":"string","answer":"string"}]}',
    instruction: `Create a FAQ with 10 questions addressing common investor concerns about this meme coin.
Return ONLY this JSON structure:
{"items":[{"question":"The question text","answer":"The answer in 1-3 plain sentences"}]}
Rules: exactly 10 items. Questions and answers are plain text, zero markdown, zero asterisks.`,
  },
  riskReport: {
    schema: '{"summary":"string","overallRiskLevel":"High|Medium|Low","risks":[{"name":"string","severity":"High|Medium|Low","likelihood":"High|Medium|Low","description":"string","mitigation":"string"}],"earlyWarningSignals":["string"],"executionRisks":["string"]}',
    instruction: `Generate a comprehensive risk analysis for this meme coin project.
Return ONLY this JSON structure:
{"summary":"2-3 sentence plain text verdict","overallRiskLevel":"High","risks":[{"name":"Risk Name","severity":"High","likelihood":"Medium","description":"Plain text description in 1-2 sentences","mitigation":"Plain text mitigation step"}],"earlyWarningSignals":["Signal one","Signal two"],"executionRisks":["Execution challenge one","Execution challenge two"]}
Rules: 5-7 risks covering market, execution, technical, and community categories. overallRiskLevel must be exactly High, Medium, or Low. severity and likelihood must be exactly High, Medium, or Low. All text plain, zero markdown.`,
  },
  scores: {
    schema: '{"analysis":"string","scores":{"launchPotential":0,"originality":0,"memeStrength":0,"survivability":0,"riskScore":0,"communityPotential":0,"executionDifficulty":0,"analysis":"string"}}',
    instruction: `Evaluate this meme coin project. Score each dimension 0-100. Be critical and objective.
Return ONLY this JSON structure:
{"analysis":"2-3 sentence plain text summary","scores":{"launchPotential":72,"originality":65,"memeStrength":80,"survivability":55,"riskScore":60,"communityPotential":70,"executionDifficulty":50,"analysis":"Plain text detailed analysis paragraph"}}
Rules: all scores are integers 0-100. All text is plain, zero markdown.`,
  },
};

// ---------------------------------------------------------------------------
// Generate endpoint
// ---------------------------------------------------------------------------
router.post("/projects/:id/generate", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const { contentType } = req.body;

    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId))).limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)).limit(1);

    const prompt = contentPrompts[contentType];
    if (!prompt) return res.status(400).json({ error: "Invalid content type" });

    const projectContext = [
      `Project Idea: ${project.idea ?? "Not set"}`,
      `Name: ${project.name ?? "Not set"}`,
      `Ticker: ${project.ticker ?? "Not set"}`,
      project.narrative ? `Narrative: ${project.narrative}` : null,
      project.lore ? `Lore summary: (lore exists)` : null,
      profile ? `Creator budget: ${profile.budget}, risk tolerance: ${profile.riskLevel}, target audience: ${profile.audience}, timeline: ${profile.timeline}` : null,
    ].filter(Boolean).join("\n");

    // Call OpenAI with strict json_object response format
    let rawContent = "";
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `${projectContext}\n\n${prompt.instruction}` },
        ],
      });
      rawContent = response.choices[0]?.message?.content ?? "";
    } catch (aiErr: any) {
      req.log.error({ aiErr }, "OpenAI call failed");
      return res.status(502).json({ error: "AI service unavailable. Please try again." });
    }

    // Parse JSON — guaranteed by response_format but we defend anyway
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Attempt to extract JSON substring
      try {
        const match = rawContent.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch {
        // Leave parsed as empty object — validators will return fallbacks
      }
    }

    // ---------------------------------------------------------------------------
    // Validate, store, and respond per content type
    // ---------------------------------------------------------------------------

    if (contentType === "name") {
      const validated = validateNameIdeas(parsed);
      return res.json({ contentType, ideas: validated.ideas });
    }

    if (contentType === "ticker") {
      const validated = validateTickerIdeas(parsed);
      return res.json({ contentType, ideas: validated.ideas });
    }

    if (contentType === "lore") {
      const validated = validateLore(parsed);
      await db.update(projectsTable)
        .set({ lore: JSON.stringify(validated), updatedAt: new Date() })
        .where(eq(projectsTable.id, id));
      return res.json({ contentType, lore: validated });
    }

    if (contentType === "roadmap") {
      const validated = validateRoadmap(parsed);
      await db.update(projectsTable)
        .set({ roadmap: JSON.stringify(validated), updatedAt: new Date() })
        .where(eq(projectsTable.id, id));
      return res.json({ contentType, roadmap: validated });
    }

    if (contentType === "brandVoice") {
      const validated = validateBrandVoice(parsed);
      await db.update(projectsTable)
        .set({ brandVoice: JSON.stringify(validated), updatedAt: new Date() })
        .where(eq(projectsTable.id, id));
      return res.json({ contentType, brandVoice: validated });
    }

    if (contentType === "launchThread") {
      const validated = validateLaunchThread(parsed);
      await db.update(projectsTable)
        .set({ launchThread: JSON.stringify(validated), updatedAt: new Date() })
        .where(eq(projectsTable.id, id));
      return res.json({ contentType, launchThread: validated });
    }

    if (contentType === "faq") {
      const validated = validateFaq(parsed);
      await db.update(projectsTable)
        .set({ faq: JSON.stringify(validated), updatedAt: new Date() })
        .where(eq(projectsTable.id, id));
      return res.json({ contentType, faq: validated });
    }

    if (contentType === "riskReport") {
      const validated = validateRiskReport(parsed);
      await db.update(projectsTable)
        .set({ riskReport: JSON.stringify(validated), updatedAt: new Date() })
        .where(eq(projectsTable.id, id));
      return res.json({ contentType, riskReport: validated });
    }

    if (contentType === "scores") {
      const analysis = stripMd(String(parsed?.analysis ?? ""));
      const s = parsed?.scores ?? {};
      const clamp = (v: any) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
      const scoreData = {
        launchPotential: clamp(s.launchPotential),
        originality: clamp(s.originality),
        memeStrength: clamp(s.memeStrength),
        survivability: clamp(s.survivability),
        riskScore: clamp(s.riskScore),
        communityPotential: clamp(s.communityPotential),
        executionDifficulty: clamp(s.executionDifficulty),
        analysis: stripMd(String(s.analysis ?? analysis)),
      };

      const existing = await db.select().from(scoresTable).where(eq(scoresTable.projectId, id)).limit(1);
      let savedScores;
      if (existing.length > 0) {
        const [updated] = await db.update(scoresTable)
          .set(scoreData)
          .where(eq(scoresTable.projectId, id))
          .returning();
        savedScores = updated;
      } else {
        const [created] = await db.insert(scoresTable)
          .values({ projectId: id, ...scoreData })
          .returning();
        savedScores = created;
      }

      return res.json({ contentType, analysis, scores: savedScores });
    }

    return res.status(400).json({ error: "Unknown content type" });
  } catch (err) {
    req.log.error({ err }, "Failed to generate content");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
router.get("/projects/:id/export", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId))).limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const [scores] = await db.select().from(scoresTable).where(eq(scoresTable.projectId, id)).limit(1);
    const scenarios = await db.select().from(scenariosTable).where(eq(scenariosTable.projectId, id));

    const parseField = (v: string | null | undefined) => {
      if (!v) return null;
      try { return JSON.parse(v); } catch { return v; }
    };

    res.json({
      projectId: project.id,
      projectName: project.name,
      ticker: project.ticker,
      idea: project.idea,
      narrative: project.narrative,
      lore: parseField(project.lore),
      roadmap: parseField(project.roadmap),
      brandVoice: parseField(project.brandVoice),
      launchThread: parseField(project.launchThread),
      faq: parseField(project.faq),
      riskReport: parseField(project.riskReport),
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
