import { useState } from "react";
import { useGetProject, useGenerateProjectContent, useExportLaunchPlan, useUpdateProject } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreGauge, ProgressBar } from "@/components/score-gauge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Download, RefreshCcw, Activity, ShieldAlert, CheckCircle2 } from "lucide-react";
import AiChat from "@/components/ai-chat";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { RiskReportPanel } from "@/components/risk-report-panel";
import { GenerationResultsDialog } from "@/components/generation-results";

interface GenerationResult {
  contentType: "name" | "ticker" | string;
  content: any;
}

export default function ProjectDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { toast } = useToast();

  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  const { data: project, isLoading, refetch } = useGetProject(id, {
    query: { enabled: !!id },
  });

  const generateContent = useGenerateProjectContent();
  const updateProject = useUpdateProject();
  const { refetch: exportPlan, isFetching: isExporting } = useExportLaunchPlan(id, {
    query: { enabled: false },
  });

  const handleGenerate = (contentType: string) => {
    generateContent.mutate(
      { id, data: { contentType } },
      {
        onSuccess: (data: any) => {
          // Name and ticker show a suggestions dialog — don't save to project
          if (contentType === "name" || contentType === "ticker") {
            setGenerationResult({ contentType, content: data?.content });
            return;
          }

          toast({
            title: "Generation Complete",
            description: `Successfully generated ${contentType}.`,
          });

          // Navigate to the right tab after generation
          if (contentType === "riskReport") setActiveTab("details");
          if (["lore", "roadmap", "brandVoice", "launchThread", "faq"].includes(contentType)) {
            setActiveTab("details");
          }

          refetch();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Generation Failed",
            description: `Failed to generate ${contentType}. Please try again.`,
          });
        },
      }
    );
  };

  const handleApplyName = async (name: string, ticker?: string) => {
    try {
      await updateProject.mutateAsync({
        id,
        data: { name, ...(ticker ? { ticker } : {}) },
      });
      toast({ title: "Name Applied", description: `Project name set to "${name}".` });
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Failed to apply name" });
    }
  };

  const handleApplyTicker = async (ticker: string) => {
    try {
      await updateProject.mutateAsync({ id, data: { ticker } });
      toast({ title: "Ticker Applied", description: `Ticker set to $${ticker}.` });
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Failed to apply ticker" });
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportPlan();
      if (result.data) {
        await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
        toast({ title: "Export Copied", description: "Launch plan JSON copied to clipboard." });
      }
    } catch {
      toast({ variant: "destructive", title: "Export Failed", description: "Failed to export launch plan." });
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

  const p = project as any;

  const GENERATOR_ACTIONS = [
    { id: "name", label: "Name Ideas", description: "5 name suggestions", icon: "✦" },
    { id: "ticker", label: "Ticker Ideas", description: "5 ticker options", icon: "$" },
    { id: "lore", label: "Origin Lore", description: "Origin story", icon: "📜" },
    { id: "roadmap", label: "90-Day Roadmap", description: "Launch phases", icon: "🗓" },
    { id: "brandVoice", label: "Brand Voice", description: "Tone guide", icon: "📣" },
    { id: "launchThread", label: "Launch Thread", description: "Twitter/X thread", icon: "🧵" },
    { id: "faq", label: "FAQ", description: "10 Q&A pairs", icon: "❓" },
    { id: "riskReport", label: "Risk Report", description: "Full risk analysis", icon: "⚠" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight font-mono text-white">
                {project.name || "UNNAMED_PROJECT"}
              </h1>
              {project.ticker && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-sm font-mono rounded-sm border border-border">
                  ${project.ticker}
                </span>
              )}
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              ID: {project.id} | STATUS:{" "}
              <span className="text-primary">ACTIVE</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Launch Scores */}
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
                    {generateContent.isPending ? (
                      <RefreshCcw className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-3 w-3" />
                    )}
                    Analyze & Score
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {!project.scores ? (
                  <div className="text-center py-8 text-muted-foreground font-mono text-sm">
                    No scores yet. Click "Analyze & Score" to generate launch metrics.
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
                    {project.scores.analysis && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs font-mono text-muted-foreground uppercase mb-2">Score Analysis</p>
                        <MarkdownRenderer content={project.scores.analysis} className="text-white text-sm" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none bg-black/20 border-b border-border p-0 h-auto overflow-x-auto flex-nowrap">
                {[
                  { id: "details", label: "Project Data" },
                  { id: "actions", label: "Generator" },
                  { id: "scenarios", label: "Scenarios" },
                  { id: "export", label: "Export" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary px-5 py-3 font-mono text-xs uppercase shrink-0"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Project Data Tab */}
              <TabsContent value="details" className="mt-4 space-y-4">
                <ContentSection label="CORE_IDEA" content={project.idea} />
                {p.narrative && <ContentSection label="NARRATIVE" content={p.narrative} />}
                {p.lore && <ContentSection label="LORE" content={p.lore} />}
                {p.roadmap && <ContentSection label="ROADMAP" content={p.roadmap} />}
                {p.brandVoice && <ContentSection label="BRAND_VOICE" content={p.brandVoice} />}
                {p.launchThread && <ContentSection label="LAUNCH_THREAD" content={p.launchThread} />}
                {p.faq && <ContentSection label="FAQ" content={p.faq} />}

                {/* Risk Report — special structured rendering */}
                {p.riskReport && (
                  <Card className="glass-card rounded-none border-border">
                    <CardHeader className="border-b border-border/50 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                          RISK_REPORT
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-mono text-muted-foreground hover:text-primary rounded-none"
                          onClick={() => handleGenerate("riskReport")}
                          disabled={generateContent.isPending}
                        >
                          <RefreshCcw className="mr-1 h-3 w-3" /> Regenerate
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <RiskReportPanel rawReport={p.riskReport} />
                    </CardContent>
                  </Card>
                )}

                {!p.lore && !p.narrative && !p.roadmap && !p.riskReport && (
                  <Card className="glass-card border-dashed border-border/50 rounded-none bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center h-32 text-center space-y-2">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No generated content yet. Go to the <button className="text-primary underline" onClick={() => setActiveTab("actions")}>Generator tab</button> to create content.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Generator Tab */}
              <TabsContent value="actions" className="mt-4">
                <Card className="glass-card rounded-none border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">AI_GENERATOR_PANEL</CardTitle>
                    <CardDescription className="text-xs">
                      Generate individual strategy components. Name/Ticker show suggestions — pick your favorite.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {GENERATOR_ACTIONS.map((action) => {
                        const isDone = Boolean(
                          action.id === "name" ? project.name :
                          action.id === "ticker" ? project.ticker :
                          action.id === "lore" ? p.lore :
                          action.id === "roadmap" ? p.roadmap :
                          action.id === "brandVoice" ? p.brandVoice :
                          action.id === "launchThread" ? p.launchThread :
                          action.id === "faq" ? p.faq :
                          action.id === "riskReport" ? p.riskReport : false
                        );
                        return (
                          <Button
                            key={action.id}
                            variant="outline"
                            className="rounded-none border-border bg-black/20 hover:bg-primary/10 hover:text-primary hover:border-primary/50 font-mono text-xs h-auto py-4 flex flex-col gap-1.5 items-center text-center whitespace-normal relative"
                            onClick={() => handleGenerate(action.id)}
                            disabled={generateContent.isPending}
                          >
                            {isDone && (
                              <CheckCircle2 className="absolute top-2 right-2 h-3 w-3 text-primary opacity-70" />
                            )}
                            <span className="text-base">{action.icon}</span>
                            <span className="font-bold">{action.label}</span>
                            <span className="text-muted-foreground text-[10px] font-normal">{action.description}</span>
                          </Button>
                        );
                      })}
                    </div>
                    {generateContent.isPending && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <RefreshCcw className="h-3 w-3 animate-spin text-primary" />
                        AI is generating content...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scenarios Tab */}
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

              {/* Export Tab */}
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

          {/* AI Chat Sidebar */}
          <div className="lg:col-span-1 h-[calc(100vh-8rem)] sticky top-24">
            <AiChat projectId={project.id} initialConversationId={project.conversationId} />
          </div>
        </div>
      </div>

      {/* Generation Results Dialog for name/ticker */}
      <GenerationResultsDialog
        open={generationResult?.contentType === "name" || generationResult?.contentType === "ticker"}
        onClose={() => setGenerationResult(null)}
        contentType={generationResult?.contentType as "name" | "ticker" | null}
        content={generationResult?.content}
        onApplyName={handleApplyName}
        onApplyTicker={handleApplyTicker}
      />
    </Layout>
  );
}

function ContentSection({ label, content }: { label: string; content?: string | null }) {
  if (!content) return null;
  return (
    <Card className="glass-card rounded-none border-border">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-xs font-mono text-muted-foreground uppercase">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <MarkdownRenderer content={content} className="text-white" />
      </CardContent>
    </Card>
  );
}
