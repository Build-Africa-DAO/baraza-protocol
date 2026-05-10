import { Link } from "react-router-dom";
import { Users, TrendingUp, MessageSquare } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { formatKSh } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  id: string;
  name: string;
  type: string;
  description: string;
  membershipFee: number;
  memberCount: number;
  fundBalance: number;
  activeDecisions: number;
  image: string;
}

const typeConfig: Record<string, { bg: string; text: string; dot: string }> = {
  savings:      { bg: "bg-primary/12",      text: "text-primary",     dot: "bg-primary" },
  cooperative:  { bg: "bg-accent/12",       text: "text-accent",      dot: "bg-accent" },
  professional: { bg: "bg-secondary/12",    text: "text-secondary",   dot: "bg-secondary" },
  housing:      { bg: "bg-orange/12",       text: "text-orange",      dot: "bg-orange" },
  welfare:      { bg: "bg-primary/12",      text: "text-primary",     dot: "bg-primary" },
  investment:   { bg: "bg-accent/12",       text: "text-accent",      dot: "bg-accent" },
  other:        { bg: "bg-muted",           text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export default function CommunityCard({
  id, name, type, description, membershipFee, memberCount, fundBalance, activeDecisions, image,
}: CommunityCardProps) {
  const tc = typeConfig[type] ?? typeConfig.other;

  return (
    <Link to={`/dashboard/${id}`} className="block h-full">
      <MagicCard className="h-full" gradientColor="#219EBC" gradientSize={200} gradientOpacity={0.06}>
        <div className={cn(
          "h-full flex flex-col p-5",
          "bg-card border border-border/60 rounded-xl",
          "transition-all duration-300",
          "hover:border-primary/30 hover:shadow-[0_0_24px_hsl(193_70%_43%/0.12)]",
        )}>
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 text-lg">
              {image}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm font-semibold text-foreground truncate leading-tight">
                {name}
              </h3>
              <span className={cn("inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize", tc.bg, tc.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", tc.dot)} />
                {type}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-1">
            {description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5 pt-4 border-t border-border/40">
            <div className="flex flex-col items-center text-center gap-0.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground tabular-nums">{memberCount}</span>
              <span className="text-[9px] text-muted-foreground">Members</span>
            </div>
            <div className="flex flex-col items-center text-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-semibold text-foreground tabular-nums truncate w-full text-center">
                {formatKSh(fundBalance)}
              </span>
              <span className="text-[9px] text-muted-foreground">Fund</span>
            </div>
            <div className="flex flex-col items-center text-center gap-0.5">
              <MessageSquare className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs font-semibold text-foreground tabular-nums">{activeDecisions}</span>
              <span className="text-[9px] text-muted-foreground">Votes</span>
            </div>
          </div>

          {/* Fee */}
          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Monthly fee</span>
            <span className="text-xs font-bold text-accent tabular-nums">{formatKSh(membershipFee)}</span>
          </div>
        </div>
      </MagicCard>
    </Link>
  );
}
