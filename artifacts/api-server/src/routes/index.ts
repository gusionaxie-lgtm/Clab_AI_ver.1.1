import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import projectsRouter from "./projects";
import scenariosRouter from "./scenarios";
import openaiRouter from "./openai";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(projectsRouter);
router.use(scenariosRouter);
router.use(openaiRouter);
router.use(dashboardRouter);

export default router;
