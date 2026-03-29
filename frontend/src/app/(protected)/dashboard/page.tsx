"use client";

import { useGetMyProblemsQuery } from "@/store/problemApi";
import { useGetProfileQuery } from "@/store/authApi";
import { ProblemCard } from "@/components/problem-card";
import { GenerateModal } from "@/components/generate-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  Clock,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { data: user } = useGetProfileQuery();
  const { data: problems, isLoading, isError } = useGetMyProblemsQuery();

  return (
    <div className="w-full max-w-300 mx-auto py-10 px-6 bg-background-base text-text-primary">
      {/* Editorial Header */}
      <header className="mb-20 max-w-3xl">
        <h1 className="text-[44px] font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
          Welcome back, {user?.name || "Scholar"}.
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed tracking-tight font-medium opacity-80">
          Your digital atelier is ready. You have {problems?.length || 0} module{problems?.length !== 1 ? 's' : ''} in your curated vault and a high-fidelity pedagogical model standing by.
        </p>
      </header>

      {/* Main Grid - Tonal Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {/* Chat with AI Card */}
        <div className="bg-surface-card rounded-4xl p-8 flex flex-col hover:-translate-y-1 hover:shadow-(--shadow-ambient) transition-all duration-500 group">
          <div className="w-12 h-12 bg-surface-elevated rounded-2xl flex items-center justify-center mb-6 shadow-(--shadow-ambient) group-hover:bg-accent/10 transition-colors">
            <MessageSquare className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">Chat with AI</h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-8 flex-1 opacity-80">
            Engage with our pedagogical models to brainstorm curriculum structures or solve complex theoretical problems.
          </p>
          <Link href="/chat">
             <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-accent font-bold group/btn">
               Enter Workspace <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
             </Button>
          </Link>
        </div>

        {/* Test My Skills Card */}
        <div className="bg-surface-card rounded-4xl p-8 flex flex-col hover:-translate-y-1 hover:shadow-(--shadow-ambient) transition-all duration-500 group">
          <div className="w-12 h-12 bg-surface-elevated rounded-2xl flex items-center justify-center mb-6 shadow-(--shadow-ambient) group-hover:bg-accent/10 transition-colors">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">Test My Skills</h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-8 flex-1 opacity-80">
             Dynamic assessments that adapt to your knowledge gaps. No multiple choice—only deep intellectual challenges.
          </p>
          <Link href="/battle">
             <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-accent font-bold group/btn">
               Start Assessment <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
             </Button>
          </Link>
        </div>

        {/* My Problems / Vault Card */}
        <div className="bg-signature rounded-4xl p-8 flex flex-col text-white hover:shadow-(--shadow-ambient-elevated) transition-all duration-500 group">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border-none ring-1 ring-white/10">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 italic">My Problems</h3>
          <p className="text-sm text-white/70 leading-relaxed mb-8 flex-1 tracking-tight font-medium">
            "The intersection of LLMs and classical rhetoric: A new era of education."
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{problems?.length || 0} Saved</span>
            <Link href="/problems">
               <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-white font-bold group/btn">
                 View Vault <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
               </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity / Sessions Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold text-text-primary tracking-tight">Recent Sessions</h2>
             <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary bg-surface-card px-3 py-1 rounded-full shadow-sm">Last 72 hours</span>
           </div>
           <div className="shrink-0">
             <GenerateModal />
           </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-4xl bg-surface-card" />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-destructive/5 text-destructive p-8 rounded-4xl font-medium text-center">
            Unable to fetch recent sessions. Please verify your connection.
          </div>
        ) : problems && problems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {problems.slice(0, 3).map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-card rounded-[40px] p-16 text-center shadow-(--shadow-ambient)">
            <div className="w-20 h-20 bg-background-base rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm opacity-50">
              <Clock className="h-8 w-8 text-text-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">No recent activity.</h3>
            <p className="text-text-secondary max-w-sm mx-auto mb-10 font-medium">
              Start your intellectual journey by generating your first challenge.
            </p>
            <GenerateModal />
          </div>
        )}
      </section>
    </div>
  );
}
