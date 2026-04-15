import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldAlert, Zap, TrendingDown, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface RiskItem {
  name: string;
  severity: "High" | "Medium" | "Low";
  likelihood: "High" | "Medium" | "Low";
  description: string;
  mitigation: string;
}

interface RiskReportData {
  summary: string;
  overallRiskLevel: "High" | "Medium" | "Low";
  risks: RiskItem[];
  earlyWarningSignals: string[];
  executionRisks: string[];
}

interface RiskReportPanelProps {
  rawReport: string;
}

function severityColor(level: string) {
  switch (level) {
    case "High":
      return "bg-red-500/15 text-red-400 border-red-500/40";
    case "Medium":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/40";
    case "Low":
      return "bg-green-500/15 text-green-400 border-green-500/40";
    default:
      return "bg-border/20 text-muted-foreground border-border/40";
  }
}

function overallBg(level: string) {
  switch (level) {
    case "High":
      return "border-red-500/40 bg-red-500/5";
    case "Medium":
      return "border-yellow-500/40 bg-yellow-500/5";
    case "Low":
      return "border-green-500/40 bg-green-500/5";
    default:
      return "border-border bg-black/20";
  }
}

function SeverityBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold font-mono rounded-sm border uppercase tracking-wider",
        severityColor(level)
      )}
    >
      {level}
    </span>
  );
}

export function RiskReportPanel({ rawReport }: RiskReportPanelProps) {
  if (!rawReport) {
    return (
      <div className="text-center py-8 text-muted-foreground font-mono text-sm">
        No risk report available. Click "Risk Report" in the Generator tab to analyze.
      </div>
    );
  }

  // Parse: rawReport may be a JSON string or legacy plain text
  let report: RiskReportData | null = null;
  try {
    const parsed = JSON.parse(rawReport);
    // Could be the structured object directly, or wrapped in a content key
    if (parsed && typeof parsed === "object") {
      if (parsed.summary || parsed.risks) {
        report = parsed as RiskReportData;
      } else if (parsed.content && typeof parsed.content === "object") {
        report = parsed.content as RiskReportData;
      }
    }
  } catch {
    // Legacy plain text — fall back to markdown renderer
  }

  // Legacy fallback: plain text report
  if (!report) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-4">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
          <span>Legacy format — regenerate for structured view</span>
        </div>
        <MarkdownRenderer content={rawReport} className="text-white" />
      </div>
    );
  }

  const safeRisks = Array.isArray(report.risks) ? report.risks : [];
  const safeSignals = Array.isArray(report.earlyWarningSignals) ? report.earlyWarningSignals : [];
  const safeExecRisks = Array.isArray(report.executionRisks) ? report.executionRisks : [];

  return (
    <div className="space-y-6">
      {/* Overall Assessment */}
      <Card className={cn("rounded-none border", overallBg(report.overallRiskLevel ?? ""))}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              OVERALL_RISK_ASSESSMENT
            </CardTitle>
            <SeverityBadge level={report.overallRiskLevel ?? "Unknown"} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white leading-relaxed">
            {report.summary || "No summary available."}
          </p>
        </CardContent>
      </Card>

      {/* Risk Breakdown Cards */}
      {safeRisks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Risk Breakdown ({safeRisks.length} factors identified)
          </h3>
          <div className="grid gap-3">
            {safeRisks.map((risk, i) => (
              <Card key={i} className="glass-card rounded-none border-border hover:border-border/80 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-white text-sm">{risk.name || "Unnamed Risk"}</h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <SeverityBadge level={risk.severity ?? "Medium"} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                    <span>LIKELIHOOD: <span className={cn(
                      "font-bold",
                      risk.likelihood === "High" ? "text-red-400" :
                      risk.likelihood === "Medium" ? "text-yellow-400" : "text-green-400"
                    )}>{risk.likelihood ?? "Unknown"}</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {risk.description || "No description available."}
                  </p>
                  {risk.mitigation && (
                    <div className="border-t border-border/30 pt-3 mt-2">
                      <p className="text-[10px] font-mono text-primary uppercase mb-1">Mitigation</p>
                      <p className="text-xs text-white/80 leading-relaxed">{risk.mitigation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Two column: Early Warning Signals + Execution Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeSignals.length > 0 && (
          <Card className="glass-card rounded-none border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-yellow-400" />
                Early Warning Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {safeSignals.map((signal, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-yellow-400 mt-0.5 shrink-0 font-bold">!</span>
                  <span className="text-muted-foreground">{signal}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {safeExecRisks.length > 0 && (
          <Card className="glass-card rounded-none border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-red-400" />
                Execution Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {safeExecRisks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-red-400 mt-0.5 shrink-0">›</span>
                  <span className="text-muted-foreground">{risk}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
