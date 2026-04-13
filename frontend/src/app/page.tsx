import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BrainCircuit,
  Zap,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col selection:bg-primary/10">
      {/* Navigation - Editorial style */}
      <nav className="flex items-center justify-between px-12 py-10 max-w-360 mx-auto w-full">
        <div className="flex flex-col">
          <span className="text-primary font-bold text-2xl tracking-tighter">AI Teach</span>
          <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-[0.3em] -mt-1">
            Digital Atelier
          </span>
        </div>
        <div className="flex items-center gap-10">
          <Link
            href="/signin"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors tracking-tight"
          >
            Sign In
          </Link>
          <Link href="/signup">
            <Button size="lg" className="rounded-xl px-8">
              Begin Journey
            </Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 pt-24 pb-40 max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container text-primary text-[11px] font-bold uppercase tracking-[0.15em] mb-12 shadow-(--shadow-ambient)">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Infinite Algorithm Synthesis</span>
        </div>

        {/* Hero Section - Display Typography */}
        <h1 className="text-[56px] md:text-[84px] italic font-serif tracking-[-0.04em] mb-10 text-primary leading-[0.95] max-w-4xl">
          Master logic in your <br />
          <span className="italic font-serif opacity-90">personal atelier.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-on-surface-variant mb-16 max-w-2xl leading-relaxed tracking-tight font-medium">
          Elevate your skill with high-fidelity pedagogical models. 
          Generate unique algorithm challenges tailored to your evolution.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
          <Link href="/signup">
            <Button
              size="lg"
              className="w-full sm:w-auto h-14 px-10 rounded-2xl gap-3 text-base shadow-(--shadow-ambient-elevated)"
            >
              Start Generating <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/signin">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto h-14 px-10 rounded-2xl text-base"
            >
              Enter Workspace
            </Button>
          </Link>
        </div>

        {/* Feature Section - Tonal Layering */}
        <div className="grid md:grid-cols-3 gap-10 mt-48 text-left w-full">
          <FeatureCard
            icon={<BrainCircuit className="w-6 h-6 text-primary" />}
            title="AI Synthesis"
            desc="Never run out of problems. Our models synthesize unique challenges calibrated to your performance metrics."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-primary" />}
            title="Tactile Feedback"
            desc="Write, run, and refine code in a high-fidelity editor. Real-time telemetry on every execution cycle."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-primary" />}
            title="Deep Assessment"
            desc="Hidden edge cases and adaptive difficulty ensure your solutions are robust under extreme conditions."
          />
        </div>
      </main>

      {/* Footer hint */}
      <footer className="py-12 px-12 border-t border-[rgba(196,198,207,0.1)] flex justify-between items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
         <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Friday AI System</span>
         <span className="text-[10px] uppercase tracking-[0.2em] font-medium">© {new Date().getFullYear()} AI Teach Atelier</span>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-surface-container-low rounded-4xl p-10 flex flex-col transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-(--shadow-ambient-elevated) group">
      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-8 shadow-(--shadow-ambient) group-hover:bg-primary/5 transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-primary mb-4 tracking-tight">{title}</h3>
      <p className="text-on-surface-variant leading-relaxed tracking-tight font-medium opacity-80">{desc}</p>
    </div>
  );
}
