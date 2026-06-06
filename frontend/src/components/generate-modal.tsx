"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type GenerationStatus,
  useGetMyProblemsQuery,
  useStartProblemGenerationMutation,
  useLazyGetProblemGenerationStatusQuery,
} from "@/store/problemApi";
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

type Language = "javascript" | "typescript" | "python";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

type ApiError = {
  data?: {
    message?: string;
    error?: string;
  };
};

const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" && error !== null && "data" in error;

export function GenerateModal({ onClick }: { onClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("javascript");
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [isSyncing, setIsSyncing] = useState(false);
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus | null>(null);

  const [startProblemGeneration, { isLoading: isStarting }] = useStartProblemGenerationMutation();
  const [triggerGenerationStatus, { isFetching: isFetchingStatus }] = useLazyGetProblemGenerationStatusQuery();
  const { refetch: refetchProblems } = useGetMyProblemsQuery();
  const router = useRouter();

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
      setGenerationStatus("PENDING");

      // 1️⃣ Start the async generation job
      const startRes = await startProblemGeneration({ language, difficulty }).unwrap();
      const generationId = startRes.generationId;
      setGenerationStatus(startRes.status);

      // 2️⃣ Poll for status every 2‑3 seconds
      const pollInterval = 2500;
      let attempts = 0;
      const maxAttempts = 30; // safety cap (≈75 s)
      let status = "";
      let problemId: string | undefined;

      // Show syncing UI while we poll
      setIsSyncing(true);
      toast.info("Generating AI problem… this may take a moment.");

      for (; attempts < maxAttempts; attempts++) {
        const data = await triggerGenerationStatus(generationId).unwrap();
        status = data.status;
        setGenerationStatus(data.status);
        if (status === "COMPLETED" && data.problemId) {
          problemId = data.problemId;
          break;
        }
        if (status === "FAILED") {
          toast.error(data.errorMessage || "Problem generation failed.");
          setOpen(false);
          return;
        }
        await new Promise((r) => setTimeout(r, pollInterval));
      }

      if (status !== "COMPLETED") {
        toast.error("Generation timed out. Please try again.");
        setOpen(false);
        return;
      }

      // 3️⃣ Generation completed – navigate to the new problem
      if (problemId) {
        toast.success("Problem generated successfully! 🎉");
        setOpen(false);
        // Invalidate problem list cache so the new problem appears
        refetchProblems();
        router.push(`/problems/${problemId}`);
      }
    } catch (err: unknown) {
      // Unexpected errors
      const message = isApiError(err)
        ? err.data?.message || err.data?.error
        : undefined;
      toast.error(message || "Failed to start problem generation");
      setGenerationStatus(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const isGenerating = isStarting || isFetchingStatus || isSyncing;
  const buttonStatus = generationStatus ?? (isStarting ? "PENDING" : null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && !isGenerating) {
      setGenerationStatus(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        className="w-[calc(100vw-2rem)] max-w-130 sm:max-w-130 bg-surface-card/95 backdrop-blur-3xl border border-border-subtle shadow-2xl p-0 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/20 via-primary to-primary/20 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]" />

        <div className="min-w-0 p-6 sm:p-8 space-y-7">
          <DialogHeader className="min-w-0 modal-animate-in">
            <div className="w-14 h-14 shrink-0 bg-primary/5 rounded-2xl flex items-center justify-center mb-4 border border-primary/10">
              <Wand2 className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="max-w-full text-2xl sm:text-3xl font-extrabold tracking-tight text-primary leading-tight text-wrap">
              Create a Challenge
            </DialogTitle>
            <DialogDescription className="max-w-full text-on-surface-variant/70 font-medium leading-relaxed text-wrap">
              Define your parameters. Our architect will construct a specialized coding inquiry tailored to your preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-6 modal-animate-in">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                <Terminal className="w-3 h-3 shrink-0" /> Runtime Language
              </label>
              <Select
                value={language}
                onValueChange={(val) => setLanguage(val as Language)}
              >
                <SelectTrigger className="h-12 w-full bg-surface-container-low/50 border-border-subtle rounded-2xl text-sm font-semibold hover:bg-surface-container transition-colors ring-offset-background focus:ring-1 focus:ring-primary">
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
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                <Layers className="w-3 h-3 shrink-0" /> Inquiry Complexity
              </label>
              <div className="grid min-w-0 grid-cols-3 gap-2">
                {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={cn(
                      "min-w-0 h-12 rounded-xl px-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border cursor-pointer",
                      difficulty === diff
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-primary/30"
                    )}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              {/* Dynamic notice for higher difficulty tiers */}
              {(difficulty === "MEDIUM" || difficulty === "HARD") && (
                <div className="mt-4 min-w-0 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 text-sm leading-relaxed">
                  <p className="font-semibold mb-1">Note</p>
                  <p className="text-wrap">
                    Higher difficulty modules run deeper validation and may take up to 45 seconds.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-[0.8fr_1.4fr] gap-3 modal-animate-in">
            <Button
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isGenerating}
              className="h-12 sm:h-14 rounded-2xl font-bold text-on-surface-variant hover:bg-destructive/5 hover:text-destructive transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="min-w-0 h-12 sm:h-14 rounded-2xl font-bold bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                  <span className="min-w-0 truncate text-sm">
                    {buttonStatus ?? "PENDING"}
                  </span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 shrink-0" />
                  <span className="truncate">Generate Inquiry</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
