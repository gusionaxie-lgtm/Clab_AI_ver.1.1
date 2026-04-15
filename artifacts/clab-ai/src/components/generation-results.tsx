import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NameSuggestion {
  name: string;
  ticker: string;
  description: string;
}

interface TickerSuggestion {
  ticker: string;
  rationale: string;
}

interface GenerationResultsProps {
  open: boolean;
  onClose: () => void;
  contentType: "name" | "ticker" | null;
  content: any;
  onApplyName?: (name: string, ticker?: string) => void;
  onApplyTicker?: (ticker: string) => void;
}

export function GenerationResultsDialog({
  open,
  onClose,
  contentType,
  content,
  onApplyName,
  onApplyTicker,
}: GenerationResultsProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  const renderContent = () => {
    if (!content) {
      return (
        <p className="text-sm text-muted-foreground font-mono text-center py-8">
          No results available.
        </p>
      );
    }

    if (contentType === "name") {
      let suggestions: NameSuggestion[] = [];

      try {
        if (Array.isArray(content)) {
          suggestions = content;
        } else if (typeof content === "string") {
          const parsed = JSON.parse(content);
          suggestions = Array.isArray(parsed) ? parsed : (parsed?.content ?? []);
        } else if (typeof content === "object" && Array.isArray(content.content)) {
          suggestions = content.content;
        }
      } catch {
        // Fallback: plain text
        return (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-mono">Raw output (regenerate for structured view):</p>
            <pre className="text-sm text-white whitespace-pre-wrap font-mono bg-black/30 p-4 border border-border/50 rounded-sm">
              {String(content)}
            </pre>
          </div>
        );
      }

      if (!suggestions.length) {
        return <p className="text-sm text-muted-foreground text-center py-8">No suggestions returned.</p>;
      }

      return (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="glass-card rounded-none border border-border p-4 space-y-2 hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base">{s.name || "—"}</span>
                  {s.ticker && (
                    <Badge
                      variant="outline"
                      className="font-mono text-xs text-primary border-primary/50 bg-primary/5 rounded-none"
                    >
                      ${s.ticker}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-none hover:bg-white/5"
                    onClick={() => copyToClipboard(`${s.name}${s.ticker ? ` / $${s.ticker}` : ""}`, i)}
                    title="Copy"
                  >
                    {copiedIdx === i ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                  {onApplyName && (
                    <Button
                      size="sm"
                      className="h-7 px-3 rounded-none text-xs bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 font-mono"
                      onClick={() => {
                        onApplyName(s.name, s.ticker);
                        onClose();
                      }}
                    >
                      Use This
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.description || ""}</p>
            </div>
          ))}
        </div>
      );
    }

    if (contentType === "ticker") {
      let suggestions: TickerSuggestion[] = [];

      try {
        if (Array.isArray(content)) {
          suggestions = content;
        } else if (typeof content === "string") {
          const parsed = JSON.parse(content);
          suggestions = Array.isArray(parsed) ? parsed : (parsed?.content ?? []);
        } else if (typeof content === "object" && Array.isArray(content.content)) {
          suggestions = content.content;
        }
      } catch {
        return (
          <pre className="text-sm text-white whitespace-pre-wrap font-mono bg-black/30 p-4 border border-border/50 rounded-sm">
            {String(content)}
          </pre>
        );
      }

      if (!suggestions.length) {
        return <p className="text-sm text-muted-foreground text-center py-8">No suggestions returned.</p>;
      }

      return (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="glass-card rounded-none border border-border p-4 space-y-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-primary text-xl font-mono">${s.ticker || "—"}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-none hover:bg-white/5"
                    onClick={() => copyToClipboard(s.ticker, i)}
                  >
                    {copiedIdx === i ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                  {onApplyTicker && (
                    <Button
                      size="sm"
                      className="h-7 px-3 rounded-none text-xs bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 font-mono"
                      onClick={() => {
                        onApplyTicker(s.ticker);
                        onClose();
                      }}
                    >
                      Use This
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{s.rationale || ""}</p>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const title = contentType === "name" ? "Name Suggestions" : "Ticker Suggestions";
  const description =
    contentType === "name"
      ? "5 AI-generated meme coin names. Click 'Use This' to apply or copy for later."
      : "5 AI-generated ticker symbols. Click 'Use This' to apply.";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-black/95 border border-border rounded-none p-0 gap-0">
        <DialogHeader className="p-5 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-mono text-white text-base">
                {title.toUpperCase().replace(" ", "_")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">
                {description}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none hover:bg-white/5 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-1">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
