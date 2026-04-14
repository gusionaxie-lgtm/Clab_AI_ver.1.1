import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

router.get("/profiles", requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)).limit(1);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to get profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/profiles", requireAuth, async (req: any, res) => {
  try {
    const { budget, riskLevel, audience, timeline, creatorType } = req.body;
    const existing = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)).limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db.update(profilesTable)
        .set({ budget, riskLevel, audience, timeline, creatorType, updatedAt: new Date() })
        .where(eq(profilesTable.userId, req.userId))
        .returning();
      return res.status(201).json(updated);
    }
    
    const [profile] = await db.insert(profilesTable)
      .values({ userId: req.userId, budget, riskLevel, audience, timeline, creatorType })
      .returning();
    res.status(201).json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to create profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profiles", requireAuth, async (req: any, res) => {
  try {
    const { budget, riskLevel, audience, timeline, creatorType } = req.body;
    const [updated] = await db.update(profilesTable)
      .set({ budget, riskLevel, audience, timeline, creatorType, updatedAt: new Date() })
      .where(eq(profilesTable.userId, req.userId))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
