import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NameIdea {
  name: string;
  ticker: string;
  description: string;
}

interface TickerIdea {
  ticker: string;
  rationale: string;
}

interface GenerationResultsProps {
  open: boolean;
  onClose: () => void;
  contentType: "name" | "ticker" | null;
  ideas: NameIdea[] | TickerIdea[] | null;
  onApplyName?: (name: string, ticker?: string) => void;
  onApplyTicker?: (ticker: string) => void;
}

export function GenerationResultsDialog({
  open,
  onClose,
  contentType,
  ideas,
  onApplyName,
  onApplyTicker,
}: GenerationResultsProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  const renderContent = () => {
    if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <p className="text-sm text-muted-foreground font-mono">
            Something went wrong. Please retry.
          </p>
        </div>
      );
    }

    if (contentType === "name") {
      const names = ideas as NameIdea[];
      return (
        <div className="space-y-3">
          {names.map((s, i) => (
            <div
              key={i}
              className="glass-card rounded-none border border-border p-4 space-y-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base">{s.name}</span>
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
                    onClick={() => copy(`${s.name}${s.ticker ? ` / $${s.ticker}` : ""}`, i)}
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
                      onClick={() => { onApplyName(s.name, s.ticker); onClose(); }}
                    >
                      Use This
                    </Button>
                  )}
                </div>
              </div>
              {s.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (contentType === "ticker") {
      const tickers = ideas as TickerIdea[];
      return (
        <div className="space-y-3">
          {tickers.map((s, i) => (
            <div
              key={i}
              className="glass-card rounded-none border border-border p-4 space-y-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-primary text-2xl font-mono">${s.ticker}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-none hover:bg-white/5"
                    onClick={() => copy(s.ticker, i)}
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
                      onClick={() => { onApplyTicker(s.ticker); onClose(); }}
                    >
                      Use This
                    </Button>
                  )}
                </div>
              </div>
              {s.rationale && (
                <p className="text-xs text-muted-foreground">{s.rationale}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const title = contentType === "name" ? "NAME_IDEAS" : "TICKER_IDEAS";
  const description =
    contentType === "name"
      ? "5 AI-generated meme coin names. Pick one and click Use This."
      : "5 AI-generated ticker symbols. Pick one and click Use This.";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-black/95 border border-border rounded-none p-0 gap-0">
        <DialogHeader className="p-5 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-mono text-white text-base">{title}</DialogTitle>
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
        <div className="p-5 max-h-[60vh] overflow-y-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
