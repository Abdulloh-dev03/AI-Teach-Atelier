"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  type Result,
  type RunCodeResponse,
  useGetProblemByIdQuery,
  useSubmitSolutionMutation,
  useRunCodeMutation,
} from "@/store/problemApi";
import {
  type SubmissionResponse,
  useGetSubmissionsQuery,
} from "@/store/submissionApi";
import { CodeEditor } from "@/components/code-editor";
import { ResultsPanel } from "@/components/results-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Play,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  XCircle,
  X,
  ChevronLeft,
  Clock,
  Terminal,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

type ApiError = {
  data?: {
    message?: string;
    error?: string;
  };
};

const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" && error !== null && "data" in error;

const getErrorMessage = (error: unknown) => {
  if (!isApiError(error)) return undefined;
  return error.data?.message || error.data?.error;
};

const toSubmissionResult = (
  result: RunCodeResponse,
  language: string,
): SubmissionResponse => ({
  status: result.status as SubmissionResponse["status"],
  passed: result.passed,
  total: result.total,
  runtime: result.runtime,
  language,
  results: result.results.map((test): Result => ({
    ...test,
    isHidden: false,
    status: test.status as Result["status"],
  })),
});

export default function ProblemDetailsPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const problemId = params.id;

  const {
    data: problem,
    isLoading: isProblemLoading,
    isError: isProblemError,
  } = useGetProblemByIdQuery(problemId);
  const [
    submitSolution,
    { isLoading: isSubmitting, error: submitError },
  ] = useSubmitSolutionMutation();
  const [
    runCode,
    { isLoading: isRunning, error: runError },
  ] = useRunCodeMutation();

  const {
    data: submissionsHistory,
    isLoading: isSubmissionsLoading,
  } = useGetSubmissionsQuery({ problemId: problemId, limit: 100 });

  const [code, setCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState("description");
  const [localSubmissionResult, setLocalSubmissionResult] =
    useState<SubmissionResponse | null>(null);

  const handleCodeChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

  const handleRun = async () => {
    if (!problem || !code) return;

    const sampleTestCases = problem.testCases
      .filter((tc) => !tc.isHidden)
      .map((tc) => ({
        input: tc.input,
        expected: tc.expected,
      }));

    try {
      const result = await runCode({
        code,
        language: problem.language,
        testCases: sampleTestCases,
      }).unwrap();
      setLocalSubmissionResult(toSubmissionResult(result, problem.language));
    } catch (err) {
      console.error("Run failed", err);
    }
  };

  const handleSubmit = async () => {
    if (!problem || !code) return;

    try {
      const result = await submitSolution({
        id: problem.id,
        code,
        language: problem.language,
      }).unwrap();
      setLocalSubmissionResult(result);
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  if (isProblemLoading) {
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-surface">
        <div className="w-full lg:w-105 p-10 bg-surface-container-low space-y-8">
          <Skeleton className="h-12 w-3/4 rounded-2xl bg-primary/5" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-20 rounded-full bg-primary/5" />
            <Skeleton className="h-6 w-24 rounded-full bg-primary/5" />
          </div>
          <Skeleton className="h-64 w-full rounded-[32px] bg-primary/5" />
        </div>
        <div className="flex-1 p-6 bg-surface">
          <Skeleton className="w-full h-full rounded-[40px] bg-primary/5" />
        </div>
      </div>
    );
  }

  if (isProblemError || !problem) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-surface text-center p-6">
        <div className="flex flex-col items-center p-12 bg-surface-container-low rounded-[40px] max-w-md shadow-(--shadow-ambient)">
          <div className="w-20 h-20 bg-destructive/5 rounded-3xl flex items-center justify-center mb-8">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-primary tracking-tight">Challenge not found</h2>
          <p className="text-on-surface-variant font-medium opacity-80 leading-relaxed">
            This module has been archived or does not exist in your vault.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="mt-10 rounded-2xl px-8"
          >
            Return to Atelier
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-surface overflow-hidden">
      {/* LEFT PANEL: Editorial Description */}
      <aside className="w-full lg:w-105 bg-surface-container-low flex flex-col h-[50vh] lg:h-full overflow-hidden relative shadow-(--shadow-ambient)">
        <div className="p-6 pb-2 shrink-0 flex items-center justify-between">
           <Button 
             variant="ghost" 
             size="sm" 
             className="px-0 hover:bg-transparent text-on-surface-variant hover:text-primary gap-2 font-bold text-xs uppercase tracking-widest"
             onClick={() => router.push("/dashboard")}
           >
             <ChevronLeft className="w-4 h-4" /> Back to Vault
           </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-10 shrink-0">
            <TabsList className="bg-transparent gap-8 p-0 h-14 w-full justify-start rounded-none border-b border-[rgba(196,198,207,0.1)]">
              <TabsTrigger
                value="description"
                className="relative h-10 rounded-none border-b-2 border-transparent px-0 pb-0 pt-0 text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all cursor-pointer"
              >
                Inquiry
              </TabsTrigger>
              <TabsTrigger
                value="submissions"
                className="relative h-10 rounded-none border-b-2 border-transparent px-0 pb-0 pt-0 text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary transition-all cursor-pointer"
              >
                Progress
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <TabsContent
              value="description"
              className="px-10 py-10 m-0 outline-none h-full"
            >
              <h1 className="text-3xl font-bold tracking-tight text-primary mb-6 leading-[1.1]">
                {problem.title}
              </h1>
              
              <div className="flex items-center gap-3 mb-10">
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-primary/5 text-primary rounded-full">
                  {problem.difficulty}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-surface-container text-on-surface-variant rounded-full flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> {problem.language}
                </span>
              </div>

              <div className="prose prose-sm prose-slate max-w-none text-on-surface-variant leading-relaxed font-serif italic text-lg opacity-90 mb-12">
                {problem.description.split("\n").map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>

              {problem.testCases && problem.testCases.filter(tc => !tc.isHidden).length > 0 && (
                <div className="space-y-8 pb-10">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-on-surface-variant mb-6">Pedagogical Examples</h3>
                  {problem.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                    <div key={tc.id} className="bg-surface rounded-2xl p-6 shadow-(--shadow-ambient) space-y-4">
                       <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-40">
                         <span>Case {idx + 1}</span>
                         <div className="h-px bg-current flex-1 mx-4 opacity-10" />
                       </div>
                       <div className="space-y-4 font-mono text-xs">
                         <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl">
                            <span className="opacity-40 uppercase tracking-tighter">Input</span>
                            <span className="text-primary truncate">{tc.input}</span>
                         </div>
                         <div className="flex flex-col gap-2 p-3 bg-primary/5 rounded-xl">
                            <span className="text-primary opacity-60 uppercase tracking-tighter">Expected</span>
                            <span className="text-primary truncate">{tc.expected}</span>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="submissions" className="px-10 py-10 m-0 outline-none h-full">
               <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-on-surface-variant mb-8 px-1">Curriculum History</h2>
               {isSubmissionsLoading ? (
                 <div className="space-y-4">
                   {[...Array(3)].map((_, i) => (
                     <Skeleton key={i} className="h-20 w-full rounded-2xl bg-primary/5" />
                   ))}
                 </div>
               ) : submissionsHistory?.data && submissionsHistory.data.length > 0 ? (
                 <div className="space-y-4">
                   {submissionsHistory.data.map((sub, i) => (
                     <div key={sub.id || i} className="bg-surface p-5 rounded-2xl flex items-center justify-between shadow-(--shadow-ambient) group">
                        <div className="flex items-center gap-4">
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center",
                             sub.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-600" : "bg-destructive/5 text-destructive"
                           )}>
                             {sub.status === "ACCEPTED" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                           </div>
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                               <span className="text-xs font-bold uppercase tracking-widest text-primary">
                                 {sub.status.replace(/_/g, " ")}
                               </span>
                               {sub.runtime !== undefined && (
                                 <span className="text-[9px] font-medium opacity-40 px-1.5 py-0.5 bg-surface-container rounded-md">
                                   {sub.runtime}ms
                                 </span>
                               )}
                             </div>
                             <span className="text-[10px] text-on-surface-variant font-medium opacity-60">
                               {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Just now"}
                             </span>
                           </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                          onClick={() => setLocalSubmissionResult(sub)}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="bg-surface p-12 rounded-[32px] text-center opacity-40 italic font-serif">
                    The canvas is currently blank. No attempts recorded.
                 </div>
               )}
            </TabsContent>
          </div>
        </Tabs>
      </aside>

      {/* RIGHT PANEL: Workspace */}
      <main className="flex-1 bg-surface flex flex-col h-[50vh] lg:h-full relative overflow-hidden p-6">
        <div className="flex-1 relative bg-white dark:bg-zinc-800 rounded-xl shadow-(--shadow-ambient-elevated) overflow-hidden ring-1 ring-[rgba(196,198,207,0.05)]">
           {/* Editor Header */}
           <div className="absolute top-0 left-0 right-0 h-14 px-8 flex items-center justify-between z-20 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border-b border-[rgba(196,198,207,0.1)]">
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Atelier Workspace</span>
                 <div className="h-4 w-px bg-on-surface-variant opacity-20" />
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Compiler Ready</span>
                 </div>
              </div>
           </div>

           <div className="absolute inset-0 pt-14">
             <CodeEditor
               problemId={problem.id}
               language={problem.language}
               code={code}
               onChangeAction={handleCodeChange}
             />
           </div>

           {/* Results Overlay */}
           {localSubmissionResult && (
             <ResultsPanel 
               result={localSubmissionResult} 
               onCloseAction={() => setLocalSubmissionResult(null)} 
             />
           )}
        </div>

        {/* Toolbar */}
        <div className="h-24 pt-6 shrink-0 flex items-center justify-between px-4">
          <div className="flex items-center gap-6 text-on-surface-variant opacity-60">
             <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold tracking-tight">00:24:12</span>
             </div>
             <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold tracking-tight">32 Credits</span>
             </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={handleRun}
              disabled={isSubmitting || isRunning || !code.trim()}
              className="h-12 px-8 rounded-2xl font-bold gap-2 cursor-pointer transition-all active:scale-95"
            >
              {isRunning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Run modules <Play className="w-4 h-4 fill-current" /></>
              )}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isRunning || !code.trim()}
              className={cn(
                "h-12 px-10 rounded-2xl font-bold gap-3 shadow-(--shadow-ambient-elevated) cursor-pointer transition-all active:scale-95",
                "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Submit Protocol <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          </div>
        </div>

        {(submitError || runError) && (
          <div className="absolute top-10 right-10 z-100 animate-in slide-in-from-top duration-500">
             <div className="bg-destructive text-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
                <AlertCircle className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest">Evolution Interrupted</span>
                  <span className="text-[11px] opacity-80">
                    {getErrorMessage(submitError) || getErrorMessage(runError) || "Execution Protocol Failed."}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {}} className="text-white hover:bg-white/10 p-1 h-auto"><X className="w-4 h-4" /></Button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
