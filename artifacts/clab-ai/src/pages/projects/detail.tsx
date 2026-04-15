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
import {
  ArrowLeft, Sparkles, Download, RefreshCcw, Activity,
  ShieldAlert, CheckCircle2, BookOpen, Map, Mic, Twitter,
  HelpCircle, AlertTriangle,
} from "lucide-react";
import AiChat from "@/components/ai-chat";
import { RiskReportPanel } from "@/components/risk-report-panel";
import { GenerationResultsDialog } from "@/components/generation-results";
import {
  LoreRenderer,
  RoadmapRenderer,
  BrandVoiceRenderer,
  LaunchThreadRenderer,
  FaqRenderer,
  ContentCard,
} from "@/components/content-renderers";

interface SuggestionState {
  contentType: "name" | "ticker";
  ideas: any[];
}

export default function ProjectDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { toast } = useToast();

  const [suggestion, setSuggestion] = useState<SuggestionState | null>(null);
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
          if (contentType === "name" || contentType === "ticker") {
            const ideas = Array.isArray(data?.ideas) ? data.ideas : [];
            if (ideas.length === 0) {
              toast({ variant: "destructive", title: "No results", description: "Something went wrong. Please retry." });
              return;
            }
            setSuggestion({ contentType: contentType as "name" | "ticker", ideas });
            return;
          }

          toast({ title: "Generated", description: `${contentType} generated successfully.` });
          refetch();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "Something went wrong. Please retry.",
          });
        },
      }
    );
  };

  const handleApplyName = async (name: string, ticker?: string) => {
    try {
      await updateProject.mutateAsync({ id, data: { name, ...(ticker ? { ticker } : {}) } });
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
        toast({ title: "Copied", description: "Launch plan JSON copied to clipboard." });
      }
    } catch {
      toast({ variant: "destructive", title: "Export Failed" });
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

  const hasLore = Boolean(p.lore);
  const hasRoadmap = Boolean(p.roadmap);
  const hasBrandVoice = Boolean(p.brandVoice);
  const hasThread = Boolean(p.launchThread);
  const hasFaq = Boolean(p.faq);
  const hasRisk = Boolean(p.riskReport);
  const hasAnyContent = hasLore || hasRoadmap || hasBrandVoice || hasThread || hasFaq || hasRisk;

  const GENERATOR_ACTIONS = [
    { id: "name", label: "Name Ideas", description: "5 name suggestions", icon: "✦", done: Boolean(project.name) },
    { id: "ticker", label: "Ticker Ideas", description: "5 ticker options", icon: "$", done: Boolean(project.ticker) },
    { id: "lore", label: "Origin Lore", description: "Origin story", icon: <BookOpen className="h-4 w-4" />, done: hasLore },
    { id: "roadmap", label: "90-Day Roadmap", description: "Launch phases", icon: <Map className="h-4 w-4" />, done: hasRoadmap },
    { id: "brandVoice", label: "Brand Voice", description: "Tone guide", icon: <Mic className="h-4 w-4" />, done: hasBrandVoice },
    { id: "launchThread", label: "Launch Thread", description: "Twitter/X thread", icon: <Twitter className="h-4 w-4" />, done: hasThread },
    { id: "faq", label: "FAQ", description: "10 Q&A pairs", icon: <HelpCircle className="h-4 w-4" />, done: hasFaq },
    { id: "riskReport", label: "Risk Report", description: "Full risk analysis", icon: <AlertTriangle className="h-4 w-4" />, done: hasRisk },
  ];

  const isGenerating = generateContent.isPending;

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
              ID: {project.id} | STATUS: <span className="text-primary">ACTIVE</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
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
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
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
                        <p className="text-sm text-white leading-relaxed">{project.scores.analysis}</p>
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
                  { id: "details", label: "Content" },
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

              {/* Content Tab */}
              <TabsContent value="details" className="mt-4 space-y-4">
                {/* Core Idea — always visible */}
                <ContentCard label="CORE_IDEA">
                  <p className="text-sm text-white/90 leading-relaxed">{project.idea || "No idea set."}</p>
                </ContentCard>

                {hasLore && (
                  <ContentCard
                    label="LORE"
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                    onRegenerate={() => handleGenerate("lore")}
                    isRegenerating={isGenerating}
                  >
                    <LoreRenderer raw={p.lore} />
                  </ContentCard>
                )}

                {hasRoadmap && (
                  <ContentCard
                    label="90-DAY_ROADMAP"
                    icon={<Map className="h-3.5 w-3.5" />}
                    onRegenerate={() => handleGenerate("roadmap")}
                    isRegenerating={isGenerating}
                  >
                    <RoadmapRenderer raw={p.roadmap} />
                  </ContentCard>
                )}

                {hasBrandVoice && (
                  <ContentCard
                    label="BRAND_VOICE"
                    icon={<Mic className="h-3.5 w-3.5" />}
                    onRegenerate={() => handleGenerate("brandVoice")}
                    isRegenerating={isGenerating}
                  >
                    <BrandVoiceRenderer raw={p.brandVoice} />
                  </ContentCard>
                )}

                {hasThread && (
                  <ContentCard
                    label="LAUNCH_THREAD"
                    icon={<Twitter className="h-3.5 w-3.5" />}
                    onRegenerate={() => handleGenerate("launchThread")}
                    isRegenerating={isGenerating}
                  >
                    <LaunchThreadRenderer raw={p.launchThread} />
                  </ContentCard>
                )}

                {hasFaq && (
                  <ContentCard
                    label="FAQ"
                    icon={<HelpCircle className="h-3.5 w-3.5" />}
                    onRegenerate={() => handleGenerate("faq")}
                    isRegenerating={isGenerating}
                  >
                    <FaqRenderer raw={p.faq} />
                  </ContentCard>
                )}

                {hasRisk && (
                  <ContentCard
                    label="RISK_REPORT"
                    icon={<ShieldAlert className="h-3.5 w-3.5 text-red-400" />}
                    onRegenerate={() => handleGenerate("riskReport")}
                    isRegenerating={isGenerating}
                  >
                    <RiskReportPanel rawReport={p.riskReport} />
                  </ContentCard>
                )}

                {!hasAnyContent && (
                  <Card className="glass-card border-dashed border-border/50 rounded-none bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center h-36 text-center space-y-3">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No generated content yet.{" "}
                        <button
                          className="text-primary underline underline-offset-2"
                          onClick={() => setActiveTab("actions")}
                        >
                          Open the Generator
                        </button>{" "}
                        to create lore, roadmap, FAQ, and more.
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
                      Generate individual strategy components. Name and Ticker show suggestion cards — you pick the best one.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {GENERATOR_ACTIONS.map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          className="rounded-none border-border bg-black/20 hover:bg-primary/10 hover:text-primary hover:border-primary/50 font-mono text-xs h-auto py-4 flex flex-col gap-1.5 items-center text-center relative"
                          onClick={() => handleGenerate(action.id)}
                          disabled={isGenerating}
                        >
                          {action.done && (
                            <CheckCircle2 className="absolute top-2 right-2 h-3 w-3 text-primary opacity-70" />
                          )}
                          <span className="text-base">
                            {typeof action.icon === "string" ? action.icon : action.icon}
                          </span>
                          <span className="font-bold">{action.label}</span>
                          <span className="text-muted-foreground text-[10px] font-normal">{action.description}</span>
                        </Button>
                      ))}
                    </div>
                    {isGenerating && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <RefreshCcw className="h-3 w-3 animate-spin text-primary" />
                        AI is generating — please wait...
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
                        Run predictive models to simulate how this coin performs under different market conditions.
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
                        Compile all generated data, scores, and scenarios into a comprehensive JSON document.
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

          {/* AI Chat sidebar */}
          <div className="lg:col-span-1 h-[calc(100vh-8rem)] sticky top-24">
            <AiChat projectId={project.id} initialConversationId={project.conversationId} />
          </div>
        </div>
      </div>

      {/* Suggestions dialog — name / ticker only */}
      <GenerationResultsDialog
        open={suggestion !== null}
        onClose={() => setSuggestion(null)}
        contentType={suggestion?.contentType ?? null}
        ideas={suggestion?.ideas ?? null}
        onApplyName={handleApplyName}
        onApplyTicker={handleApplyTicker}
      />
    </Layout>
  );
}
