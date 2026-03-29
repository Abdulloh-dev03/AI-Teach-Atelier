"use client";

import { useState } from "react";
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
import { Loader2, Plus, Sparkles } from "lucide-react";

export function GenerateModal({ onClick }: { onClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<
    "javascript" | "typescript" | "python" | "cpp" | "java" | "c" | "go"
  >("javascript");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "EASY",
  );

  const [generateProblem, { isLoading }] = useGenerateProblemMutation();
  const router = useRouter();

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
          className="relative w-full md:w-auto p-px rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 bg-border-subtle overflow-hidden group"
        >
          <div className="absolute inset-0 bg-signature opacity-80 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-2 px-6 py-3 rounded-xl bg-background-base group-hover:bg-background-base/90 transition-colors duration-200">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-text-primary">Generate New</span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25 bg-surface-card border-border-subtle text-text-primary">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Generate AI Problem
          </DialogTitle>
          <DialogDescription>
            Select a language and difficulty. Our AI will craft a unique coding
            challenge for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium text-right">Language</span>
            <Select
              value={language}
              onValueChange={(val: any) => setLanguage(val)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="go">Go</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium text-right">Difficulty</span>
            <Select
              value={difficulty}
              onValueChange={(val: any) => setDifficulty(val)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
