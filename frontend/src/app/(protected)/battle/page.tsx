"use client";

import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Sword, 
  Target, 
  Zap, 
  Sparkles,
  ChevronRight,
  BrainCircuit,
  Trophy,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BattlePage() {
  const challenges = [
    { 
      id: 1, 
      title: "Algorithmic Duel: Dynamic Programming", 
      difficulty: "HARD", 
      reward: "850 XP",
      participants: 42,
      status: "ACTIVE"
    },
    { 
      id: 2, 
      title: "Theory Clash: Recursive Logic", 
      difficulty: "MEDIUM", 
      reward: "400 XP",
      participants: 128,
      status: "LOCKED"
    },
    { 
      id: 3, 
      title: "Syntax Skirmish: Type Systems", 
      difficulty: "EASY", 
      reward: "150 XP",
      participants: 310,
      status: "COMPLETED"
    }
  ];

  return (
    <div className="w-full max-w-300 mx-auto py-10 px-6 bg-background-base text-text-primary">
      {/* Header */}
      <header className="mb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent/5 rounded-xl flex items-center justify-center">
            <Sword className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-sm font-bold uppercase tracking-[0.4em] text-text-secondary opacity-60">The Arena</h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <h2 className="text-[44px] font-bold tracking-tight text-text-primary leading-[1.1] max-w-2xl">
            Intellectual Combat. <br />
            <span className="italic font-serif opacity-80">Prove your synthesis.</span>
          </h2>
          <Button className="h-14 px-8 rounded-2xl bg-signature border-none shadow-(--shadow-ambient-elevated) gap-2">
            <Zap className="w-4 h-4" /> Start Quick Battle
          </Button>
        </div>
      </header>

      {/* Arena Hub Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        {/* Active Challenges */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-8 text-text-primary">
            <h3 className="text-xl font-bold tracking-tight">Active Arenas</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full">3 LIVE NOW</span>
          </div>
          
          {challenges.map((ch) => (
            <div 
              key={ch.id} 
              className={cn(
                "group relative p-8 rounded-4xl bg-surface-card border-none ring-1 ring-border-subtle hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden shadow-(--shadow-ambient)",
                ch.status === "LOCKED" && "opacity-60 grayscale cursor-not-allowed"
              )}
            >
              {ch.status === "ACTIVE" && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-surface-elevated rounded-2xl flex items-center justify-center shadow-sm">
                    {ch.status === "LOCKED" ? <Shield className="w-6 h-6 opacity-40" /> : <Target className="w-6 h-6 text-accent" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-text-primary mb-1">{ch.title}</h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-60">
                      <span>{ch.difficulty}</span>
                      <span>•</span>
                      <span>{ch.participants} Contenders</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                     <div className="text-sm font-bold text-text-primary">{ch.reward}</div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-accent">Reward</div>
                  </div>
                  <Button 
                    disabled={ch.status === "LOCKED"}
                    variant={ch.status === "COMPLETED" ? "outline" : "default"}
                    className={cn(
                      "rounded-xl h-12 px-6 border-none",
                      ch.status === "COMPLETED" ? "bg-surface-elevated text-text-secondary" : "bg-signature shadow-(--shadow-ambient-elevated)"
                    )}
                  >
                    {ch.status === "COMPLETED" ? "Review" : "Enter Arena"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar: Rankings & Stats */}
        <div className="space-y-12">
           <div className="bg-surface-card rounded-4xl p-10 shadow-(--shadow-ambient) ring-1 ring-border-subtle">
              <div className="flex items-center gap-3 mb-8">
                 <Trophy className="w-5 h-5 text-accent" />
                 <h3 className="text-lg font-bold text-text-primary tracking-tight">Leaderboard</h3>
              </div>
              <div className="space-y-6">
                 {[1, 2, 3, 4, 5].map((place) => (
                   <div key={place} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4">
                         <span className="text-xs font-bold opacity-30 w-4">{place}</span>
                         <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-[10px] font-bold">JD</div>
                         <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Scholar_{place * 123}</span>
                      </div>
                      <span className="text-xs font-bold text-text-secondary">2.4k</span>
                   </div>
                 ))}
              </div>
              <Button variant="ghost" className="w-full mt-10 rounded-xl h-12 text-accent font-bold gap-2 hover:bg-accent/10">
                 View Rankings <ChevronRight className="w-4 h-4" />
              </Button>
           </div>

           <div className="bg-surface-card rounded-4xl p-10 shadow-(--shadow-ambient) ring-1 ring-border-subtle overflow-hidden relative group">
              <div className="absolute inset-0 bg-signature opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" />
              <div className="relative">
                 <div className="flex items-center gap-3 mb-6">
                    <History className="w-5 h-5 text-text-secondary" />
                    <h3 className="text-lg font-bold text-text-primary tracking-tight">Recent Activity</h3>
                 </div>
                 <p className="text-sm text-text-secondary leading-relaxed opacity-60 italic mb-8">
                    "Defeated the Red-Black Synthesis challenge with 98% efficiency."
                 </p>
                 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    <span>2 hours ago</span>
                    <span className="text-emerald-500">+450 XP</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
