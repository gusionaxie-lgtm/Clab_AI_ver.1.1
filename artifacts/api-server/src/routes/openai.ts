import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { conversations, messages, projectsTable, profilesTable, scoresTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

const MEME_STRATEGIST_SYSTEM_PROMPT = `You are Clab AI — a MemeCoin Launch Strategist specializing in the Four.meme + BNB Chain ecosystem. You are analytical, structured, and honest. You act like a senior crypto strategy advisor.

Your approach:
- Ask clarifying questions before giving final advice (especially on the first message)
- Critically evaluate ideas — never blindly agree
- Provide structured outputs with clear sections
- Give specific, actionable recommendations
- Reference real patterns from successful and failed meme coin launches
- Be direct about risks without being alarmist
- Focus on strategy, execution, and probability-based insights
- Never make financial promises or profit guarantees

When analyzing a meme coin concept, you evaluate:
1. Originality and differentiation
2. Meme strength and cultural resonance
3. Community building potential
4. Technical execution requirements
5. Long-term survivability factors
6. Risk profile

Always structure your responses with clear headers when doing analysis. Use bullet points for key factors. End with actionable next steps.`;

router.get("/openai/conversations", requireAuth, async (req: any, res) => {
  try {
    const convs = await db.select().from(conversations);
    res.json(convs);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/openai/conversations", requireAuth, async (req: any, res) => {
  try {
    const { title } = req.body;
    const [conv] = await db.insert(conversations).values({ title }).returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/openai/conversations/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    if (!conv) return res.status(404).json({ error: "Not found" });
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id));
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/openai/conversations/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/openai/conversations/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id));
    res.json(msgs);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/openai/conversations/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const convId = Number(req.params.id);
    const { content } = req.body;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;

    const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    await db.insert(messages).values({ conversationId: convId, role: "user", content });

    const allMessages = await db.select().from(messages).where(eq(messages.conversationId, convId));

    let contextInfo = "";
    if (projectId) {
      const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
      const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)).limit(1);
      const [scores] = await db.select().from(scoresTable).where(eq(scoresTable.projectId, projectId)).limit(1);
      
      if (project) {
        contextInfo = `\n\nCurrent Project Context:
- Idea: ${project.idea}
- Name: ${project.name ?? "Not set"}
- Ticker: ${project.ticker ?? "Not set"}
- Narrative: ${project.narrative ?? "Not defined"}
${scores ? `- Launch Score: ${scores.launchPotential}/100, Meme Strength: ${scores.memeStrength}/100, Survivability: ${scores.survivability}/100` : ""}
${profile ? `\nCreator Profile: Budget: ${profile.budget}, Risk Tolerance: ${profile.riskLevel}, Target Audience: ${profile.audience}, Timeline: ${profile.timeline}, Type: ${profile.creatorType}` : ""}`;
      }
    } else {
      const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)).limit(1);
      if (profile) {
        contextInfo = `\n\nUser Profile: Budget: ${profile.budget}, Risk Tolerance: ${profile.riskLevel}, Target Audience: ${profile.audience}, Timeline: ${profile.timeline}, Creator Type: ${profile.creatorType}`;
      }
    }

    const chatMessages = [
      {
        role: "system" as const,
        content: MEME_STRATEGIST_SYSTEM_PROMPT + contextInfo,
      },
      ...allMessages.slice(0, -1).slice(-20).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const chunkContent = chunk.choices[0]?.delta?.content;
      if (chunkContent) {
        fullResponse += chunkContent;
        res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId: convId, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
    res.end();
  }
});

router.post("/openai/generate-image", requireAuth, async (req: any, res) => {
  try {
    const { prompt, size } = req.body;
    const buffer = await generateImageBuffer(prompt, size as any ?? "1024x1024");
    res.json({ b64_json: buffer.toString("base64") });
  } catch (err) {
    req.log.error({ err }, "Failed to generate image");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
