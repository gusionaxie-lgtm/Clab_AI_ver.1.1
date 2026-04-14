import { useState, useEffect, useRef } from "react";
import { useGetProject, useGenerateProjectContent, useExportLaunchPlan } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreGauge, ProgressBar } from "@/components/score-gauge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Download, RefreshCcw, Activity, ShieldAlert, MessageSquare } from "lucide-react";
import AiChat from "@/components/ai-chat";

export default function ProjectDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  
  const { data: project, isLoading, refetch } = useGetProject(id, {
    query: { enabled: !!id }
  });

  const generateContent = useGenerateProjectContent();
  const { refetch: exportPlan, isFetching: isExporting } = useExportLaunchPlan(id, {
    query: { enabled: false }
  });

  const handleGenerate = (contentType: any) => {
    generateContent.mutate(
      { id, data: { contentType } },
      {
        onSuccess: () => {
          toast({
            title: "Generation Complete",
            description: `Successfully generated ${contentType}.`,
          });
          refetch();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Generation Failed",
            description: `Failed to generate ${contentType}.`,
          });
        }
      }
    );
  };

  const handleExport = async () => {
    try {
      const result = await exportPlan();
      if (result.data) {
        await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
        toast({
          title: "Export Copied",
          description: "Launch plan data copied to clipboard.",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export launch plan.",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Project Not Found</h2>
          <Link href="/projects">
            <Button variant="link" className="mt-4">Return to Projects</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono text-white">
                {project.name || "UNNAMED_PROJECT"}
              </h1>
              {project.ticker && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-sm font-mono rounded-sm border border-border">
                  ${project.ticker}
                </span>
              )}
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1">ID: {project.id} | STATUS: ACTIVE</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card rounded-none border-border">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-mono flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    LAUNCH_SCORES
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-none font-mono text-xs border-primary/50 text-primary hover:bg-primary/10"
                    onClick={() => handleGenerate("scores")}
                    disabled={generateContent.isPending}
                  >
                    {generateContent.isPending ? <RefreshCcw className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
                    Analyze & Score
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {!project.scores ? (
                  <div className="text-center py-8 text-muted-foreground font-mono text-sm">
                    No scores available. Run AI analysis to generate launch metrics.
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-center gap-8 flex-wrap">
                      <ScoreGauge score={project.scores.launchPotential} label="Launch Potential" size="lg" />
                      <ScoreGauge score={project.scores.memeStrength} label="Meme Strength" size="lg" />
                      <ScoreGauge score={project.scores.riskScore} label="Risk Score" size="lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-border/50">
                      <ProgressBar score={project.scores.originality} label="Originality" />
                      <ProgressBar score={project.scores.survivability} label="Survivability" />
                      <ProgressBar score={project.scores.communityPotential} label="Community Potential" />
                      <ProgressBar score={project.scores.executionDifficulty} label="Execution Difficulty" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start rounded-none bg-black/20 border-b border-border p-0 h-auto">
                <TabsTrigger value="details" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary px-6 py-3 font-mono text-xs uppercase">
                  Project Data
                </TabsTrigger>
                <TabsTrigger value="actions" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary px-6 py-3 font-mono text-xs uppercase">
                  Generator
                </TabsTrigger>
                <TabsTrigger value="scenarios" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary px-6 py-3 font-mono text-xs uppercase">
                  Scenarios
                </TabsTrigger>
                <TabsTrigger value="export" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary px-6 py-3 font-mono text-xs uppercase">
                  Export
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4 space-y-4">
                <Card className="glass-card rounded-none border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono text-muted-foreground">CORE_IDEA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white whitespace-pre-wrap">{project.idea}</p>
                  </CardContent>
                </Card>

                {project.narrative && (
                  <Card className="glass-card rounded-none border-border">
                    <CardHeader>
                      <CardTitle className="text-sm font-mono text-muted-foreground">NARRATIVE</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white whitespace-pre-wrap">{project.narrative}</p>
                    </CardContent>
                  </Card>
                )}

                {project.lore && (
                  <Card className="glass-card rounded-none border-border">
                    <CardHeader>
                      <CardTitle className="text-sm font-mono text-muted-foreground">LORE</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white whitespace-pre-wrap">{project.lore}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <Card className="glass-card rounded-none border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">AI_GENERATOR_PANEL</CardTitle>
                    <CardDescription>Generate individual components of your launch strategy.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { id: "name", label: "Generate Name" },
                      { id: "ticker", label: "Generate Ticker" },
                      { id: "lore", label: "Generate Lore" },
                      { id: "roadmap", label: "Generate Roadmap" },
                      { id: "brandVoice", label: "Brand Voice" },
                      { id: "launchThread", label: "Launch Thread" },
                      { id: "faq", label: "Create FAQ" },
                      { id: "riskReport", label: "Risk Report" },
                    ].map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="rounded-none border-border bg-black/20 hover:bg-primary/10 hover:text-primary hover:border-primary/50 font-mono text-xs h-auto py-4 flex flex-col gap-2 items-center text-center whitespace-normal"
                        onClick={() => handleGenerate(action.id)}
                        disabled={generateContent.isPending}
                      >
                        <Sparkles className="h-4 w-4" />
                        {action.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scenarios" className="mt-4">
                <Card className="glass-card rounded-none border-border">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-mono font-bold text-lg">Scenario Simulator</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        Run advanced predictive models to simulate how this meme coin might perform under different market conditions.
                      </p>
                    </div>
                    <Link href={`/scenarios/${project.id}`}>
                      <Button className="bg-primary text-primary-foreground glow-green rounded-none">
                        Access Simulator
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="mt-4">
                <Card className="glass-card rounded-none border-border">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                    <Download className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-mono font-bold text-lg">Export Launch Plan</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        Compile all generated data, scores, and scenarios into a comprehensive JSON launch document.
                      </p>
                    </div>
                    <Button 
                      onClick={handleExport}
                      disabled={isExporting}
                      className="bg-primary text-primary-foreground glow-green rounded-none"
                    >
                      {isExporting ? "Compiling..." : "Copy JSON Payload"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1 h-[calc(100vh-8rem)] sticky top-24">
            <AiChat projectId={project.id} initialConversationId={project.conversationId} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
