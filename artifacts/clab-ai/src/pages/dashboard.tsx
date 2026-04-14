import { useGetDashboardSummary, useGetProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, Plus, FolderGit2, AlertTriangle, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout";

export default function Dashboard() {
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
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
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
              Please initialize your strategist profile before accessing the terminal dashboard.
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

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono text-white">TERMINAL_OVERVIEW</h1>
            <p className="text-muted-foreground mt-1">
              System status: <span className="text-primary">Online</span> | Risk tolerance: <span className="uppercase text-accent">{profile?.riskLevel}</span>
            </p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none border border-primary glow-green">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card rounded-none border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">ACTIVE_PROJECTS</CardTitle>
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{summary?.totalProjects || 0}</div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-none border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">AVG_LAUNCH_SCORE</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {summary?.avgLaunchScore ? summary.avgLaunchScore.toFixed(1) : "0.0"}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-none border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">SCENARIOS_RUN</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{summary?.totalScenarios || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight font-mono text-white border-b border-border pb-2">RECENT_ACTIVITY</h2>
          
          {!hasProjects ? (
            <Card className="glass-card border-dashed border-border rounded-none bg-transparent">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center space-y-4">
                <FolderGit2 className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-white">No projects found in database</p>
                  <p className="text-sm text-muted-foreground mt-1">Initialize your first meme coin project to begin analysis.</p>
                </div>
                <Link href="/projects/new">
                  <Button variant="outline" className="rounded-none border-primary/50 text-primary hover:bg-primary/10">
                    Initialize Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {summary?.recentProjects?.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="glass-card rounded-none cursor-pointer hover:border-primary/50 transition-colors group">
                    <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">
                            {project.name || "Unnamed Project"}
                          </h3>
                          {project.ticker && (
                            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-mono rounded-sm border border-border">
                              ${project.ticker}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-2xl">
                          {project.idea}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-mono">
                        <span className="text-muted-foreground">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { ArrowRight } from "lucide-react";
