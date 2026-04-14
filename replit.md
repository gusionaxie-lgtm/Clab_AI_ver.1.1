# Clab AI — MemeCoin Launch Strategist

## Overview

A premium, production-ready full-stack web app for the Four.meme + BNB Chain ecosystem. Clab AI is a serious AI launch strategist that helps users design, evaluate, simulate, and improve meme coin concepts.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/clab-ai)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)
- **Auth**: Clerk (email + social)
- **Validation**: Zod + drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Architecture

### Frontend (artifacts/clab-ai)
- React + Vite at path `/`
- Clerk authentication (email + social login)
- Dark terminal theme with green/yellow accents
- Pages: Landing, Sign-in, Sign-up, Onboarding, Dashboard, Projects, Project Detail, Scenarios, Analytics

### Backend (artifacts/api-server)
- Express 5 API server at path `/api`
- Clerk middleware for auth
- OpenAI streaming chat (SSE)
- All routes require authentication

### Database Schema
- `profiles` — user profiles (budget, risk level, audience, timeline, creator type)
- `projects` — meme coin projects (idea, name, ticker, narrative, lore, roadmap, etc.)
- `scores` — launch scores (launchPotential, originality, memeStrength, survivability, riskScore, communityPotential, executionDifficulty)
- `scenarios` — simulated launch scenarios (viral, organic, failure, copycat, low-budget, hype collapse)
- `conversations` — AI chat conversations
- `messages` — AI chat messages

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## AI Features

- Real-time streaming chat with MemeCoin Launch Strategist persona
- Content generation: name, ticker, lore, roadmap, brand voice, launch thread, FAQ, risk report
- Score analysis: 7-dimensional launch scoring (0-100)
- Scenario simulation: 6 scenario types with probability, outcome, key factors, mitigations
- Full launch plan export

## Environment Variables (auto-provisioned)
- `DATABASE_URL` — PostgreSQL connection
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth
- `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI via Replit AI Integrations
