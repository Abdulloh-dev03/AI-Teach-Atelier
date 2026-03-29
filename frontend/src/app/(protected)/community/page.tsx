"use client";

import { Button } from "@/components/ui/button";
import { 
  Users, 
  Trophy, 
  Flame, 
  Search, 
  Filter,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Zap,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommunityPage() {
  const challenges = [
    { title: "The Red-Black Synthesis", author: "Julian A.", participants: 124, difficulty: "HARD", xp: 450 },
    { title: "Asymptotic Elegance", author: "Elena R.", participants: 89, difficulty: "MEDIUM", xp: 300 },
    { title: "Greedy Heuristics Vol. 1", author: "Marcus K.", participants: 210, difficulty: "EASY", xp: 150 },
    { title: "Binary Search Variations", author: "Sarah L.", participants: 56, difficulty: "HARD", xp: 500 },
    { title: "Graph Theory: Flow", author: "David W.", participants: 15, difficulty: "INSANE", xp: 1200 },
  ];

  return (
    <div className="w-full max-w-300 mx-auto py-10 px-6 bg-background-base text-text-primary">
      <header className="mb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent/5 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-sm font-bold uppercase tracking-[0.4em] text-text-secondary opacity-60">The Global Atelier</h1>
        </div>
        <h2 className="text-[44px] font-bold tracking-tight text-text-primary leading-[1.1] max-w-2xl">
          Collaborative Synthesis. <br />
          <span className="italic font-serif opacity-80">Join the collective.</span>
        </h2>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
         <StatCard icon={<Trophy className="w-5 h-5" />} label="Active Challenges" value="1,240" />
         <StatCard icon={<Flame className="w-5 h-5" />} label="Atelier Heat" value="98.4%" />
         <StatCard icon={<Zap className="w-5 h-5" />} label="Total Credits Rewarded" value="12M" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
         <div className="relative flex-1 max-w-md w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary opacity-40 group-focus-within:text-accent transition-all" />
            <input 
              placeholder="Search shared synthetics..." 
              className="w-full bg-surface-card h-14 pl-12 pr-6 rounded-2xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all shadow-(--shadow-ambient)"
            />
         </div>
         <div className="flex items-center gap-4">
            <Button variant="secondary" className="h-14 px-8 rounded-2xl gap-2 shadow-(--shadow-ambient) bg-surface-card hover:bg-surface-elevated text-text-primary border-none">
               <Filter className="w-4 h-4" /> Filters
            </Button>
            <Button className="h-14 px-8 rounded-2xl gap-2 shadow-(--shadow-ambient-elevated) bg-signature border-none">
               <PlusIcon className="w-4 h-4" /> Share Synthetic
            </Button>
         </div>
      </div>

      {/* Challenge List - No Lines Rule */}
      <div className="space-y-4">
         {challenges.map((ch, i) => (
           <div key={i} className="group bg-surface-card p-8 rounded-4xl flex flex-col md:flex-row items-center justify-between gap-8 hover:-translate-y-1 hover:shadow-(--shadow-ambient-elevated) transition-all duration-500 cursor-pointer">
              <div className="flex items-center gap-6 flex-1">
                 <div className="w-14 h-14 bg-surface-elevated rounded-2xl flex items-center justify-center shadow-(--shadow-ambient) group-hover:bg-accent/10 transition-colors">
                    <Sparkles className="w-6 h-6 text-accent" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1 tracking-tight group-hover:text-accent transition-colors">{ch.title}</h3>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest opacity-60">Synthesized by {ch.author}</p>
                 </div>
              </div>

              <div className="flex items-center gap-12 text-text-secondary">
                 <div className="hidden lg:flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Participants</span>
                    <span className="text-sm font-bold text-text-primary">{ch.participants}</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Difficulty</span>
                    <span className="text-xs font-bold text-text-primary px-3 py-1 bg-accent/10 rounded-full">{ch.difficulty}</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Reward</span>
                    <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                       <Star className="w-3.5 h-3.5 fill-current" />
                       <span className="text-sm">{ch.xp} XP</span>
                    </div>
                 </div>
              </div>

              <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-surface-elevated shadow-(--shadow-ambient) text-text-primary hover:bg-accent/10 transition-all">
                 <ArrowRight className="w-5 h-5" />
              </Button>
           </div>
         ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-surface-card p-8 rounded-4xl shadow-(--shadow-ambient) group">
       <div className="text-accent opacity-40 group-hover:opacity-100 transition-opacity">{icon}</div>
       <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary mb-1">{label}</span>
          <span className="text-3xl font-bold text-text-primary tracking-tighter">{value}</span>
       </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
