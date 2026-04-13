"use client";

import { useState, useMemo } from "react";
import { useGetMyProblemsQuery } from "@/store/problemApi";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  Search, 
  Filter, 
  SortAsc, 
  Clock,
  Inbox,
  Terminal,
  Code2,
  CheckCircle2,
  ChevronRight,
  Trash
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GenerateModal } from "@/components/generate-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { DeleteModal } from "@/components/delete-model";
import { DeleteAllButton } from "@/components/delete-all-button";
import { cn } from "@/lib/utils";

export default function ProblemsPage() {
  const { data: allProblems, isLoading, isError } = useGetMyProblemsQuery();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const filteredProblems = useMemo(() => {
    if (!allProblems) return [];

    let remainingProblems = [...allProblems];

    // 1. Apply search filter
    if (searchQuery) {
      remainingProblems = remainingProblems.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 2. Apply difficulty filter
    if (difficultyFilter !== "ALL") {
      remainingProblems = remainingProblems.filter(
        (p) => p.difficulty === difficultyFilter
      );
    }

    // 3. Apply sorting
    if (sortBy === "oldest") {
      remainingProblems.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else {
      remainingProblems.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return remainingProblems;
  }, [allProblems, searchQuery, difficultyFilter, sortBy]);

  const difficultyConfig = {
    EASY: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20",
    MEDIUM: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20",
    HARD: "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20",
  };

  return (
    <div className="w-full max-w-300 mx-auto py-10 px-6 bg-background-base text-text-primary">
      {/* Page Header */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-[44px] font-bold tracking-tight text-text-primary leading-[1.1] mb-4">
              All Problems
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed tracking-tight font-medium opacity-80">
              Manage and solve your generated problems
            </p>
          </div>
          <div className="shrink-0 pb-2 flex items-start gap-4">
            <DeleteAllButton disabled={!allProblems || allProblems.length === 0} />
            <GenerateModal />
          </div>
        </div>
      </header>

      {/* Filters & Sorting Sticky Section */}
      <div className="sticky top-0 z-10 py-6 mb-10 bg-background-base/80 backdrop-blur-md border-b border-border-subtle/50">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary opacity-50 group-focus-within:text-accent transition-colors" />
            <Input
              placeholder="Search problems by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-surface-card border-border-subtle rounded-2xl focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-surface-card border border-border-subtle px-3 py-1.5 rounded-2xl">
              <Filter className="w-3.5 h-3.5 text-text-secondary opacity-60" />
              <span className="text-xs font-bold uppercase tracking-widest text-text-secondary opacity-60 mr-1">Difficulty:</span>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 text-sm font-bold p-0 min-w-20 cursor-pointer">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-surface-elevated border-border-subtle">
                  <SelectItem value="ALL" className="font-medium cursor-pointer">All</SelectItem>
                  <SelectItem value="EASY" className="text-emerald-500 font-medium cursor-pointer">Easy</SelectItem>
                  <SelectItem value="MEDIUM" className="text-amber-500 font-medium cursor-pointer">Medium</SelectItem>
                  <SelectItem value="HARD" className="text-rose-500 font-medium cursor-pointer">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-surface-card border border-border-subtle px-3 py-1.5 rounded-2xl">
              <SortAsc className="w-3.5 h-3.5 text-text-secondary opacity-60" />
              <span className="text-xs font-bold uppercase tracking-widest text-text-secondary opacity-60 mr-1">Sort by:</span>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 text-sm font-bold p-0 min-w-25 cursor-pointer">
                  <SelectValue placeholder="Newest" />
                </SelectTrigger>
                <SelectContent className="bg-surface-elevated border-border-subtle">
                  <SelectItem value="newest" className="font-medium cursor-pointer">Newest First</SelectItem>
                  <SelectItem value="oldest" className="font-medium cursor-pointer">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <section>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full bg-surface-card rounded-xl" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full bg-surface-card/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-destructive/5 text-destructive p-12 rounded-4xl font-medium text-center border border-destructive/10">
            <h3 className="text-xl font-bold mb-2">Connection Interrupted</h3>
            <p className="opacity-80">Unable to retrieve your vault data. Please refresh or check your internet.</p>
          </div>
        ) : filteredProblems.length > 0 ? (
          <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden relative shadow-(--shadow-ambient)">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-surface-elevated/50">
                  <TableRow className="border-border-subtle hover:bg-transparent">
                    <TableHead className="font-semibold text-text-secondary w-[30%] h-12">Title</TableHead>
                    <TableHead className="font-semibold text-text-secondary">Difficulty</TableHead>
                    <TableHead className="font-semibold text-text-secondary">Language</TableHead>
                    <TableHead className="font-semibold text-text-secondary">Status</TableHead>
                    <TableHead className="font-semibold text-text-secondary">Created At</TableHead>
                    <TableHead className="font-semibold text-text-secondary text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProblems.map((problem) => {
                    const isSolved = problem.submissions?.some(s => s.status === "ACCEPTED");
                    return (
                      <TableRow 
                        key={problem.id}
                        className={cn(
                          "group border-border-subtle cursor-pointer transition-all duration-300 hover:bg-surface-elevated/50",
                          isSolved && "bg-emerald-500/5 hover:bg-emerald-500/10"
                        )}
                        onClick={() => router.push(`/problems/${problem.id}`)}
                      >
                        <TableCell className="font-medium text-text-primary py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background-base flex items-center justify-center shrink-0 border border-border-subtle group-hover:border-accent/40 group-hover:bg-accent/5 transition-all">
                              <Code2 className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors" />
                            </div>
                            <span className="line-clamp-1 group-hover:text-accent transition-colors">
                              {problem.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "border-none uppercase tracking-wider text-[10px] whitespace-nowrap", 
                              difficultyConfig[problem.difficulty]
                            )}
                          >
                            {problem.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary font-medium">
                          {problem.language}
                        </TableCell>
                        <TableCell>
                          {isSolved ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/20 gap-1.5 px-2.5 py-0.5 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" />
                              Solved
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-surface-elevated text-text-secondary border-none hover:bg-surface-elevated/80 px-2.5 py-0.5 whitespace-nowrap">
                              Unsolved
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-text-secondary whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 opacity-70" />
                            {new Date(problem.createdAt).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <DeleteModal
                              problemId={problem.id}
                              problemTitle={problem.title}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-text-secondary hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash className="w-4 h-4" />
                                  <span className="sr-only">Delete problem</span>
                                </Button>
                              }
                            />
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-3 rounded-lg font-bold group/btn text-accent hover:bg-accent/10"
                              onClick={() => router.push(`/problems/${problem.id}`)}
                            >
                              Solve <ChevronRight className="ml-1 w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-surface-card rounded-[40px] p-20 text-center shadow-(--shadow-ambient) border border-border-subtle/50">
            <div className="w-24 h-24 bg-background-base rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm opacity-50 ring-1 ring-border-subtle">
              <Inbox className="h-10 w-10 text-text-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">No problems found.</h3>
            <p className="text-text-secondary max-w-sm mx-auto mb-10 font-medium leading-relaxed opacity-70">
              {searchQuery || difficultyFilter !== "ALL" 
                ? "Try adjusting your filters or search query to find what you're looking for."
                : "No more problems yet. Generate new ones from the dashboard to fill your vault."}
            </p>
            {!searchQuery && difficultyFilter === "ALL" && <GenerateModal />}
          </div>
        )}
      </section>

      {/* Footer Info */}
      <footer className="mt-24 pt-10 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-6 text-text-secondary opacity-60">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Vault Analytics</span>
        </div>
        <p className="text-sm font-medium italic">
          Showing {filteredProblems.length} of {allProblems?.length || 0} total archived challenges.
        </p>
      </footer>
    </div>
  );
}
