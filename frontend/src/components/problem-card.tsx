"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Code2, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  Signal,
  ArrowRight,
  ChevronRight,
  Trash
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Problem } from "@/store/problemApi";
import { DeleteModal } from "./delete-model";

export function ProblemCard({ problem }: { problem: Problem }) {
  
  const difficultyConfig = {
    EASY: "text-emerald-500 bg-emerald-500/10",
    MEDIUM: "text-amber-500 bg-amber-500/10",
    HARD: "text-rose-500 bg-rose-500/10",
  };

  const isSolved = problem.submissions?.some(s => s.status === "ACCEPTED");

  return (
    <div className="group relative flex flex-col h-full bg-surface-card rounded-4xl p-6 hover:-translate-y-1.5 transition-all duration-500 ease-in-out shadow-(--shadow-ambient) hover:shadow-(--shadow-ambient-elevated) ring-1 ring-border-subtle">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
             <span className={cn(
               "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
               difficultyConfig[problem.difficulty]
             )}>
               {problem.difficulty}
             </span>
             {isSolved && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">SOLVED</span>
                </div>
             )}
           </div>
        </div>
        <div className="flex items-center gap-2">
          <DeleteModal
            problemId={problem.id}
            problemTitle={problem.title}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-destructive/5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus-visible:opacity-100"
              >
                <Trash className="w-3.5 h-3.5" />
                <span className="sr-only">Delete problem</span>
              </Button>
            }
          />
          <div className="w-10 h-10 bg-surface-elevated rounded-xl flex items-center justify-center group-hover:bg-accent/10 transition-colors">
            <Code2 className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-1 tracking-tight">
          {problem.title}
        </h3>
        <p className="text-sm text-text-secondary font-medium opacity-70 mb-6">
          {problem.language} • {problem.language === 'Algorithm' ? 'Log(N)' : 'Complexity O(N)'}
        </p>
      </div>

      {/* Card Footer - Tonal shift for meta info */}
      <div className="mt-auto pt-6 border-t border-border-subtle flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-text-secondary opacity-60">
           <div className="flex items-center gap-1.5">
             <Clock className="w-3.5 h-3.5" />
             <span className="text-[11px] font-semibold">
               {new Date(problem.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {new Date(problem.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
             </span>
           </div>
        </div>

        <Link href={`/problems/${problem.id}`} className="shrink-0">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-10 px-4 rounded-xl font-bold group/btn text-accent hover:bg-accent/10"
          >
            Solve <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
