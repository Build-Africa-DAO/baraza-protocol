import { Marquee } from "@/components/ui/marquee";
import { Users, TrendingUp, Vote } from "lucide-react";

const communities = [
  { name: "Kilimani Chama", type: "Savings", members: 48, fund: "KSh 2.4M", emoji: "🌿" },
  { name: "Westlands SACCO", type: "Cooperative", members: 120, fund: "KSh 8.1M", emoji: "🤝" },
  { name: "Techies Welfare", type: "Welfare", members: 32, fund: "KSh 640K", emoji: "💻" },
  { name: "Mama Mboga Fund", type: "Investment", members: 65, fund: "KSh 1.8M", emoji: "🌺" },
  { name: "Estate Owners", type: "Housing", members: 90, fund: "KSh 12M", emoji: "🏘️" },
  { name: "Nairobi Creatives", type: "Professional", members: 55, fund: "KSh 920K", emoji: "🎨" },
  { name: "Youth Builders", type: "Savings", members: 40, fund: "KSh 480K", emoji: "🔨" },
  { name: "Green Farms Co-op", type: "Cooperative", members: 78, fund: "KSh 3.2M", emoji: "🌱" },
];

function CommunityChip({ community }: { community: typeof communities[0] }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/60 hover:border-primary/30 transition-all duration-200 select-none min-w-[220px]">
      <span className="text-2xl">{community.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{community.name}</p>
        <p className="text-[11px] text-muted-foreground">{community.type}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[11px] font-semibold text-accent">{community.fund}</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Users className="w-2.5 h-2.5" /> {community.members}
        </span>
      </div>
    </div>
  );
}

const recentActivity = [
  { action: "New decision passed", community: "Kilimani Chama", time: "2m ago", icon: Vote },
  { action: "12 members joined", community: "Westlands SACCO", time: "8m ago", icon: Users },
  { action: "Fund grew 18%", community: "Estate Owners", time: "15m ago", icon: TrendingUp },
  { action: "KSh 50K disbursed", community: "Mama Mboga Fund", time: "22m ago", icon: TrendingUp },
  { action: "Vote concluded", community: "Techies Welfare", time: "34m ago", icon: Vote },
  { action: "5 new members", community: "Nairobi Creatives", time: "1h ago", icon: Users },
];

function ActivityChip({ item }: { item: typeof recentActivity[0] }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/60 min-w-[260px] select-none">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{item.action}</p>
        <p className="text-[11px] text-muted-foreground truncate">{item.community}</p>
      </div>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.time}</span>
    </div>
  );
}

export function CommunityMarquee() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Section dividers */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 mb-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Live on Baraza
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Communities thriving right now
          </h2>
        </div>
      </div>

      <div className="relative flex flex-col gap-3">
        {/* Row 1 — communities */}
        <Marquee pauseOnHover className="[--duration:35s]" repeat={2}>
          {communities.map((c) => (
            <CommunityChip key={c.name} community={c} />
          ))}
        </Marquee>

        {/* Row 2 — activity, reversed */}
        <Marquee pauseOnHover reverse className="[--duration:28s]" repeat={2}>
          {recentActivity.map((item) => (
            <ActivityChip key={item.action} item={item} />
          ))}
        </Marquee>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      </div>
    </section>
  );
}
