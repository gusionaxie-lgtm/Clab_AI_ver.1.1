import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { projectsTable, scoresTable, scenariosTable, profilesTable } from "@workspace/db";
import { eq, avg, count, desc } from "drizzle-orm";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/dashboard/summary", requireAuth, async (req: any, res) => {
  try {
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.userId, req.userId))
      .orderBy(desc(projectsTable.createdAt))
      .limit(10);

    const totalProjectsResult = await db.select({ count: count() })
      .from(projectsTable)
      .where(eq(projectsTable.userId, req.userId));

    const totalProjects = Number(totalProjectsResult[0]?.count ?? 0);

    const scenarioCountResult = await db.select({ count: count() })
      .from(scenariosTable)
      .innerJoin(projectsTable, eq(scenariosTable.projectId, projectsTable.id))
      .where(eq(projectsTable.userId, req.userId));

    const totalScenarios = Number(scenarioCountResult[0]?.count ?? 0);

    const avgScoreResult = await db.select({ avg: avg(scoresTable.launchPotential) })
      .from(scoresTable)
      .innerJoin(projectsTable, eq(scoresTable.projectId, projectsTable.id))
      .where(eq(projectsTable.userId, req.userId));

    const avgLaunchScore = Number(avgScoreResult[0]?.avg ?? 0);

    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)).limit(1);

    const recentProjects = projects.slice(0, 5);
    const topProject = projects[0] ?? null;

    res.json({
      totalProjects,
      avgLaunchScore: Math.round(avgLaunchScore * 10) / 10,
      totalScenarios,
      recentProjects,
      topProject,
      profileComplete: !!profile,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
