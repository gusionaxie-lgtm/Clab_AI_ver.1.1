import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertTriangle, X, MessageSquare, Calendar, Mic2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tryParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === "object") return raw as unknown as T;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-6 text-muted-foreground font-mono text-sm">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lore Renderer
// ---------------------------------------------------------------------------
interface LoreData { paragraphs: string[] }

export function LoreRenderer({ raw }: { raw: string | null | undefined }) {
  const data = tryParse<LoreData>(raw, { paragraphs: [] });
  const paragraphs = Array.isArray(data?.paragraphs) ? data.paragraphs : [];

  if (!paragraphs.length) return <Empty message="No lore generated yet." />;

  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm text-white/90 leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roadmap Renderer
// ---------------------------------------------------------------------------
interface RoadmapPhase { name: string; weeks: string; milestones: string[] }
interface RoadmapData { phases: RoadmapPhase[] }

const PHASE_COLORS = [
  "border-primary/40 bg-primary/5",
  "border-yellow-500/40 bg-yellow-500/5",
  "border-purple-500/40 bg-purple-500/5",
];

export function RoadmapRenderer({ raw }: { raw: string | null | undefined }) {
  const data = tryParse<RoadmapData>(raw, { phases: [] });
  const phases = Array.isArray(data?.phases) ? data.phases : [];

  if (!phases.length) return <Empty message="No roadmap generated yet." />;

  return (
    <div className="space-y-4">
      {phases.map((phase, i) => (
        <Card key={i} className={cn("rounded-none border", PHASE_COLORS[i % PHASE_COLORS.length])}>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-sm font-bold text-white">{phase.name}</CardTitle>
              {phase.weeks && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {phase.weeks}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {Array.isArray(phase.milestones) && phase.milestones.map((m, j) => (
              <div key={j} className="flex items-start gap-2 text-xs">
                <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{m}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brand Voice Renderer
// ---------------------------------------------------------------------------
interface BrandVoiceData {
  tone: string;
  dos: string[];
  donts: string[];
  phrases: string[];
}

export function BrandVoiceRenderer({ raw }: { raw: string | null | undefined }) {
  const data = tryParse<BrandVoiceData>(raw, { tone: "", dos: [], donts: [], phrases: [] });

  const hasTone = typeof data?.tone === "string" && data.tone.length > 0;
  const dos = Array.isArray(data?.dos) ? data.dos : [];
  const donts = Array.isArray(data?.donts) ? data.donts : [];
  const phrases = Array.isArray(data?.phrases) ? data.phrases : [];

  if (!hasTone && !dos.length && !donts.length) return <Empty message="No brand voice generated yet." />;

  return (
    <div className="space-y-5">
      {hasTone && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-muted-foreground uppercase">
            <Mic2 className="h-3 w-3 text-primary" /> Tone
          </div>
          <p className="text-sm text-white/90 leading-relaxed">{data.tone}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dos.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold text-green-400 uppercase">Do</p>
            {dos.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Check className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        )}

        {donts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold text-red-400 uppercase">Don't</p>
            {donts.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <X className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {phrases.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Sample Phrases</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {phrases.map((phrase, i) => (
              <div
                key={i}
                className="text-xs text-white/80 bg-white/5 border border-border/40 px-3 py-2 rounded-sm italic"
              >
                "{phrase}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Launch Thread Renderer
// ---------------------------------------------------------------------------
interface Tweet { number: number; text: string }
interface LaunchThreadData { tweets: Tweet[] }

export function LaunchThreadRenderer({ raw }: { raw: string | null | undefined }) {
  const data = tryParse<LaunchThreadData>(raw, { tweets: [] });
  const tweets = Array.isArray(data?.tweets) ? data.tweets : [];

  if (!tweets.length) return <Empty message="No launch thread generated yet." />;

  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-bold font-mono text-primary">
              {tweet.number ?? i + 1}
            </div>
            {i < tweets.length - 1 && (
              <div className="w-px flex-1 min-h-[12px] bg-border/40" />
            )}
          </div>
          <div className="pb-3 flex-1">
            <p className="text-sm text-white/90 leading-relaxed">{tweet.text}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              {tweet.text?.length ?? 0} / 280 chars
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ Renderer
// ---------------------------------------------------------------------------
interface FaqItem { question: string; answer: string }
interface FaqData { items: FaqItem[] }

export function FaqRenderer({ raw }: { raw: string | null | undefined }) {
  const data = tryParse<FaqData>(raw, { items: [] });
  const items = Array.isArray(data?.items) ? data.items : [];

  if (!items.length) return <Empty message="No FAQ generated yet." />;

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold font-mono text-primary uppercase">Q{i + 1}</span>
            </div>
            <p className="text-sm font-semibold text-white">{item.question}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-9">{item.answer}</p>
          {i < items.length - 1 && <div className="pt-2 border-b border-border/30" />}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic section wrapper (used in detail page for all typed content)
// ---------------------------------------------------------------------------
export function ContentCard({
  label,
  icon,
  children,
  onRegenerate,
  isRegenerating,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}) {
  return (
    <Card className="glass-card rounded-none border-border">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-2">
            {icon}
            {label}
          </CardTitle>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              {isRegenerating ? "Generating..." : "↻ Regenerate"}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}
