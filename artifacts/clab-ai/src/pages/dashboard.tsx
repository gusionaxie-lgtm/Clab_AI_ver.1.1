import { useGetDashboardSummary, useGetProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Plus,
  FolderGit2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout";
import { stripMarkdown } from "@/components/markdown-renderer";
import { cn } from "@/lib/utils";

function RiskBadge({ level }: { level?: string }) {
  const val = (level ?? "").toLowerCase();
  const color =
    val === "high"
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : val === "medium"
      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
      : "bg-green-500/15 text-green-400 border-green-500/30";
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-bold font-mono rounded-sm border uppercase tracking-wider",
        color
      )}
    >
      {level ?? "—"}
    </span>
  );
}

const QUICK_ACTIONS = [
  { label: "New Project", icon: Plus, href: "/projects/new", primary: true },
  { label: "View Projects", icon: FolderGit2, href: "/projects", primary: false },
  { label: "Analytics", icon: TrendingUp, href: "/analytics", primary: false },
  { label: "Run Simulation", icon: ShieldAlert, href: "/projects", primary: false },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();

  if (profileLoading || summaryLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-64 md:col-span-2 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile && !profileLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 text-primary">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold tracking-tight">Profile Setup Required</h2>
            <p className="text-muted-foreground">
              Initialize your strategist profile before accessing the terminal dashboard.
            </p>
          </div>
          <Link href="/onboarding">
            <Button className="bg-primary text-primary-foreground glow-green rounded-none">
              Initialize Profile
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasProjects = summary && summary.totalProjects > 0;
  const recentProject = summary?.recentProjects?.[0];
  const avgScore = summary?.avgLaunchScore ?? 0;

  const scoreColor =
    avgScore >= 71 ? "text-green-400" : avgScore >= 41 ? "text-yellow-400" : "text-red-400";

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-primary/70 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-sm">
                SYSTEM ONLINE
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-mono text-white">
              TERMINAL_OVERVIEW
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Risk tolerance:{" "}
              <RiskBadge level={profile?.riskLevel} />
              {" "}| Budget: <span className="text-white font-mono text-xs">{profile?.budget ?? "—"}</span>
            </p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none border border-primary glow-green shrink-0">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="glass-card rounded-none border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground font-mono">
                TOTAL_PROJECTS
              </CardTitle>
              <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{summary?.totalProjects ?? 0}</div>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                {summary?.totalProjects === 1 ? "project tracked" : "projects tracked"}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-none border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground font-mono">
                AVG_LAUNCH_SCORE
              </CardTitle>
              <Activity className="h-3.5 w-3.5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", scoreColor)}>
                {avgScore > 0 ? avgScore.toFixed(1) : "—"}
              </div>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                {avgScore >= 71 ? "strong portfolio" : avgScore >= 41 ? "developing" : avgScore > 0 ? "needs work" : "no scores yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-none border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground font-mono">
                SCENARIOS_RUN
              </CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{summary?.totalScenarios ?? 0}</div>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">simulations executed</p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-none border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground font-mono">
                ACTIVE_PROJECT
              </CardTitle>
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
            </CardHeader>
            <CardContent>
              {recentProject ? (
                <>
                  <div className="text-sm font-bold text-white truncate">
                    {recentProject.name || "Unnamed"}
                  </div>
                  {recentProject.ticker && (
                    <span className="text-[10px] font-mono text-primary">${recentProject.ticker}</span>
                  )}
                </>
              ) : (
                <>
                  <div className="text-xl font-bold text-muted-foreground">—</div>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">no projects yet</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Grid: Recent Activity + Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Recent Activity — takes 2 cols */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-tight font-mono text-white border-b border-border pb-2 flex-1">
                RECENT_ACTIVITY
              </h2>
              {hasProjects && (
                <Link href="/projects">
                  <span className="text-[10px] font-mono text-primary hover:text-primary/80 flex items-center gap-0.5 pb-2 ml-4">
                    View all <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              )}
            </div>

            {!hasProjects ? (
              <Card className="glass-card border-dashed border-border rounded-none bg-transparent">
                <CardContent className="flex flex-col items-center justify-center h-48 text-center space-y-4">
                  <FolderGit2 className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-white">No projects yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Initialize your first meme coin project to start tracking.
                    </p>
                  </div>
                  <Link href="/projects/new">
                    <Button
                      variant="outline"
                      className="rounded-none border-primary/50 text-primary hover:bg-primary/10"
                    >
                      Initialize Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {summary?.recentProjects?.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="glass-card rounded-none cursor-pointer hover:border-primary/40 transition-colors group">
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors">
                              {project.name || "Unnamed Project"}
                            </h3>
                            {project.ticker && (
                              <span className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-mono rounded-sm border border-border shrink-0">
                                ${project.ticker}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {stripMarkdown(project.idea ?? "No idea description")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                          <span className="text-muted-foreground">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Quick Actions + AI Insights */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card className="glass-card rounded-none border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant={action.primary ? "default" : "outline"}
                      className={cn(
                        "w-full rounded-none justify-start font-mono text-xs h-9",
                        action.primary
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
                          : "border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <action.icon className="mr-2 h-3.5 w-3.5" />
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="glass-card rounded-none border-border border-primary/20">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {!hasProjects ? (
                  <p className="text-xs text-muted-foreground font-mono">
                    Create a project and run AI analysis to see insights here.
                  </p>
                ) : recentProject ? (
                  <>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Latest tracked:{" "}
                      <span className="text-white font-medium">
                        {recentProject.name || "Unnamed"}
                      </span>
                      {recentProject.ticker ? (
                        <> (<span className="text-primary font-mono">${recentProject.ticker}</span>)</>
                      ) : null}
                      . Run AI scoring to generate launch metrics and risk profile.
                    </p>
                    <Link href={`/projects/${recentProject.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-none border-primary/40 text-primary hover:bg-primary/10 font-mono text-[10px] h-8"
                      >
                        View Full Analysis
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
