"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGenerateProblemMutation } from "@/store/problemApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, Wand2, Terminal, Layers } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

export function GenerateModal({ onClick }: { onClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<
    "javascript" | "typescript" | "python"
  >("javascript");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "EASY",
  );

  const [generateProblem, { isLoading }] = useGenerateProblemMutation();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (open) {
      gsap.fromTo(
        ".modal-animate-in",
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "power4.out" }
      );
    }
  }, [open]);

  const handleGenerate = async () => {
    try {
      const res = await generateProblem({ language, difficulty }).unwrap();
      toast.success("Problem generated successfully! 🎉");
      setOpen(false);
      router.push(`/problems/${res.problem.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to generate problem");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={onClick}
          className="relative group h-12 w-full md:w-auto px-6 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all duration-300 border border-border-subtle cursor-pointer overflow-hidden shadow-sm"
        >
          <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="relative flex items-center justify-center gap-2.5">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-bold tracking-tight text-primary uppercase ">AI Forge</span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-120 bg-surface-card/80 backdrop-blur-3xl border border-border-subtle shadow-2xl p-0 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/20 via-primary to-primary/20 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]" />
        
        <div className="p-8 space-y-8">
          <DialogHeader className="modal-animate-in">
            <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-4 border border-primary/10">
              <Wand2 className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-extrabold tracking-tight text-primary leading-tight">
              Create a Challenge
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant/70 font-medium leading-relaxed">
              Define your parameters. Our architect will construct a specialized coding inquiry tailored to your preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 modal-animate-in">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Runtime Language
              </label>
              <Select
                value={language}
                onValueChange={(val: any) => setLanguage(val)}
              >
                <SelectTrigger className="h-14 bg-surface-container-low/50 border-border-subtle rounded-2xl text-sm font-semibold hover:bg-surface-container transition-colors ring-offset-background focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border-subtle rounded-xl shadow-xl">
                  <SelectItem value="javascript" className="py-3 font-medium transition-colors cursor-pointer">JavaScript</SelectItem>
                  <SelectItem value="typescript" className="py-3 font-medium transition-colors cursor-pointer">TypeScript</SelectItem>
                  <SelectItem value="python" className="py-3 font-medium transition-colors cursor-pointer">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant flex items-center gap-2">
                <Layers className="w-3 h-3" /> Inquiry Complexity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={cn(
                      "h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border cursor-pointer",
                      difficulty === diff
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-primary/30"
                    )}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3 modal-animate-in">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1 h-14 rounded-2xl font-bold text-on-surface-variant hover:bg-destructive/5 hover:text-destructive transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-[1.5] h-14 rounded-2xl font-bold bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 gap-3 active:scale-95 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Generate Inquiry
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
