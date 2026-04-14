import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProject, useListScenarios, useCreateScenario } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShieldAlert, TrendingUp, TrendingDown, RefreshCcw, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SCENARIO_TYPES = [
  { id: "viral_growth", label: "Viral Growth", icon: TrendingUp, color: "text-green-500 border-green-500/50 bg-green-500/10" },
  { id: "slow_organic", label: "Slow Organic", icon: Activity, color: "text-blue-500 border-blue-500/50 bg-blue-500/10" },
  { id: "failure", label: "Total Failure", icon: TrendingDown, color: "text-red-500 border-red-500/50 bg-red-500/10" },
  { id: "copycat_attack", label: "Copycat Attack", icon: ShieldAlert, color: "text-yellow-500 border-yellow-500/50 bg-yellow-500/10" },
  { id: "low_budget", label: "Low Budget Start", icon: Activity, color: "text-purple-500 border-purple-500/50 bg-purple-500/10" },
  { id: "hype_collapse", label: "Hype Collapse", icon: TrendingDown, color: "text-orange-500 border-orange-500/50 bg-orange-500/10" },
];

export default function Scenarios() {
  const params = useParams();
  const projectId = parseInt(params.projectId || "0", 10);
  const { toast } = useToast();
  
  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId }
  });

  const { data: scenarios, isLoading: scenariosLoading, refetch } = useListScenarios(
    { projectId },
    { query: { enabled: !!projectId } }
  );

  const createScenario = useCreateScenario();
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  const handleSimulate = (scenarioType: any) => {
    createScenario.mutate(
      { data: { projectId, scenarioType } },
      {
        onSuccess: (newScenario) => {
          toast({
            title: "Simulation Complete",
            description: "Scenario modeling finished successfully.",
          });
          refetch();
          setSelectedScenarioId(newScenario.id);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Simulation Failed",
            description: "An error occurred while running the scenario.",
          });
        }
      }
    );
  };

  if (projectLoading || scenariosLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[600px] w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedScenario = scenarios?.find(s => s.id === selectedScenarioId) || scenarios?.[0];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono text-white">
              SCENARIO_SIMULATOR
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              Target: {project?.name || `Project ${projectId}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="space-y-4">
            <Card className="glass-card rounded-none border-border">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Simulation Profiles</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {SCENARIO_TYPES.map(type => {
                  const existing = scenarios?.find(s => s.scenarioType === type.id);
                  return (
                    <div key={type.id} className="flex flex-col gap-2 p-3 border border-border bg-black/20 rounded-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium">{type.label}</span>
                        </div>
                        {existing ? (
                          <Badge variant="outline" className="rounded-none font-mono text-[10px] bg-primary/10 text-primary border-primary/50">
                            COMPUTED
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {existing && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1 rounded-none text-xs h-7"
                            onClick={() => setSelectedScenarioId(existing.id)}
                          >
                            View Result
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 rounded-none text-xs h-7 border-primary/50 text-primary hover:bg-primary/10"
                          onClick={() => handleSimulate(type.id)}
                          disabled={createScenario.isPending}
                        >
                          {createScenario.isPending ? <RefreshCcw className="h-3 w-3 animate-spin" /> : (existing ? "Re-simulate" : "Simulate")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {selectedScenario ? (
              <Card className="glass-card rounded-none border-border h-full">
                <CardHeader className="border-b border-border/50 pb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="rounded-none font-mono mb-2 bg-primary/10 text-primary border-primary/50">
                        {selectedScenario.scenarioType.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <CardTitle className="text-2xl font-bold">{selectedScenario.title}</CardTitle>
                      {selectedScenario.timeline && (
                        <CardDescription className="font-mono mt-1 text-muted-foreground">
                          Estimated Timeline: {selectedScenario.timeline}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono text-muted-foreground uppercase">Probability</span>
                      <span className={cn(
                        "text-3xl font-bold font-mono",
                        selectedScenario.probability > 0.6 ? "text-primary" :
                        selectedScenario.probability > 0.3 ? "text-yellow-500" : "text-muted-foreground"
                      )}>
                        {Math.round(selectedScenario.probability * 100)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  <div>
                    <h3 className="font-mono text-sm font-bold uppercase text-muted-foreground mb-3">Predicted Outcome</h3>
                    <p className="text-white bg-black/20 p-4 border border-border/50 rounded-sm whitespace-pre-wrap leading-relaxed">
                      {selectedScenario.outcome}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-mono text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Key Catalysts
                      </h3>
                      <ul className="space-y-2">
                        {selectedScenario.keyFactors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="text-muted-foreground">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Mitigations / Actions
                      </h3>
                      <ul className="space-y-2">
                        {selectedScenario.mitigations.map((mitigation, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-accent mt-0.5">•</span>
                            <span className="text-muted-foreground">{mitigation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 border border-dashed border-border/50 bg-black/10">
                <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="font-mono font-bold text-lg text-muted-foreground">Awaiting Input</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Select a simulation profile from the left panel to generate predictive analysis for this project.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
