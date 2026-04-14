import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreGauge({ score, label, className, size = "md" }: ScoreGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(100, score || 0));
  
  let colorClass = "text-red-500";
  let strokeClass = "stroke-red-500";
  let glowClass = "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
  
  if (normalizedScore > 40 && normalizedScore <= 70) {
    colorClass = "text-yellow-500";
    strokeClass = "stroke-yellow-500";
    glowClass = "drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]";
  } else if (normalizedScore > 70) {
    colorClass = "text-primary";
    strokeClass = "stroke-primary";
    glowClass = "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]";
  }

  const sizes = {
    sm: { svg: 60, stroke: 4, text: "text-sm", label: "text-[10px]" },
    md: { svg: 100, stroke: 6, text: "text-2xl", label: "text-xs" },
    lg: { svg: 140, stroke: 8, text: "text-4xl", label: "text-sm" },
  };

  const currentSize = sizes[size];
  const center = currentSize.svg / 2;
  const radius = center - currentSize.stroke;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className="relative flex items-center justify-center">
        {/* Background Circle */}
        <svg
          width={currentSize.svg}
          height={currentSize.svg}
          className="transform -rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-muted/30"
            strokeWidth={currentSize.stroke}
            fill="none"
          />
          {/* Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className={cn("transition-all duration-1000 ease-in-out", strokeClass, glowClass)}
            strokeWidth={currentSize.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold font-mono", colorClass, currentSize.text, glowClass)}>
            {normalizedScore}
          </span>
        </div>
      </div>
      <span className={cn("font-mono font-medium text-muted-foreground uppercase text-center w-full truncate px-1", currentSize.label)}>
        {label}
      </span>
    </div>
  );
}

export function ProgressBar({ score, label, className }: { score: number; label: string; className?: string }) {
  const normalizedScore = Math.max(0, Math.min(100, score || 0));
  
  let bgClass = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
  let textClass = "text-red-500";
  
  if (normalizedScore > 40 && normalizedScore <= 70) {
    bgClass = "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
    textClass = "text-yellow-500";
  } else if (normalizedScore > 70) {
    bgClass = "bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]";
    textClass = "text-primary";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center text-xs font-mono uppercase">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-bold", textClass)}>{normalizedScore}/100</span>
      </div>
      <div className="h-2 w-full bg-muted/30 overflow-hidden border border-border/50">
        <div 
          className={cn("h-full transition-all duration-1000 ease-in-out", bgClass)} 
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
    </div>
  );
}
