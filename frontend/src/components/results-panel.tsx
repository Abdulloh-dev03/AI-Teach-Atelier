"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertTriangle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SubmissionResponse } from "@/store/submissionApi";

interface ResultsPanelProps {
  result: SubmissionResponse;
  onCloseAction: () => void;
}

export function ResultsPanel({ result, onCloseAction }: ResultsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Register GSAP plugins
  useEffect(() => {
    // any plugin registration if needed
  }, []);

  useGSAP(
    () => {
      if (result) {
        // Slide in animation
        gsap.fromTo(
          panelRef.current,
          { x: "100%", opacity: 0 },
          {
            x: "0%",
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          },
        );

        // Fade in table contents
        gsap.fromTo(
          tableRef.current,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            delay: 0.3,
            ease: "power1.out",
          },
        );
      }
    },
    { dependencies: [result], scope: panelRef },
  );

  const handleClose = () => {
    gsap.to(panelRef.current, {
      x: "100%",
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: onCloseAction,
    });
  };

  let StatusIcon = CheckCircle2;
  let statusColor =
    "text-accent-green bg-accent-green/10 border-accent-green/20";

  if (result.status === "WRONG_ANSWER") {
    StatusIcon = XCircle;
    statusColor = "text-accent-red bg-accent-red/10 border-accent-red/20";
  } else if (
    result.status === "RUNTIME_ERROR" ||
    result.status === "TIME_LIMIT_EXCEEDED"
  ) {
    StatusIcon = AlertTriangle;
    statusColor =
      "text-accent-orange bg-accent-orange/10 border-accent-orange/20";
  }

  const formatStatus = (status: string) => {
    if (!status) return "";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div
      ref={panelRef}
      className="fixed top-36 right-6 bottom-6 w-[calc(100%-3rem)] sm:w-125 md:w-150 z-100 border border-border-subtle rounded-2xl bg-surface-card/80 p-8 shadow-(--shadow-ambient-elevated) backdrop-blur-2xl flex flex-col"
    >
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-text-primary">Execution Results</h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 text-[10px] font-bold uppercase tracking-wider gap-1.5",
                statusColor,
              )}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {formatStatus(result.status)}
            </Badge>
            <div className="flex items-center gap-4 text-[13px] font-medium text-text-secondary">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-accent-green" />
                <span>
                  {result.passed}/{result.total} Passed
                </span>
              </span>
              <div className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-accent-blue" />
                <span>{result.runtime !== undefined ? `${result.runtime}ms` : "—"}</span>
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-2xl text-text-secondary hover:text-text-primary transition-all duration-200 border border-border-subtle group cursor-pointer"
          aria-label="Close results"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div 
        ref={tableRef}
        className="flex-1 overflow-hidden flex flex-col rounded-lg border border-border-subtle bg-surface-elevated/30"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-surface-container-low/60 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12 text-[10px] font-bold uppercase tracking-widest text-text-secondary py-4">
                  #
                </TableHead>
                <TableHead className="w-28 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Input
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Expected
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Output
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(result.results || []).map((test, idx) => {
                const isPassed = test.status === "Passed";
                return (
                  <TableRow
                    key={idx}
                    className={cn(
                      "border-border-subtle transition-colors",
                      !isPassed
                        ? "bg-accent-red/5 hover:bg-accent-red/10"
                        : "hover:bg-surface-elevated/50",
                    )}
                  >
                    <TableCell className="font-mono text-xs text-text-secondary py-4">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5",
                          isPassed
                            ? "bg-accent-green/10 text-accent-green border-accent-green/20"
                            : "bg-accent-red/10 text-accent-red border-accent-red/20",
                        )}
                      >
                        {test.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="font-mono text-[11px] text-text-secondary whitespace-pre-wrap max-w-20 truncate"
                      title={test.isHidden ? "Hidden" : String(test.input)}
                    >
                      {test.isHidden ? (
                        <span className="opacity-40 italic">Hidden</span>
                      ) : (
                        test.input
                      )}
                    </TableCell>
                    <TableCell
                      className="font-mono text-[11px] text-text-secondary whitespace-pre-wrap max-w-20 truncate"
                      title={test.isHidden ? "Hidden" : String(test.expected)}
                    >
                      {test.isHidden ? (
                        <span className="opacity-40 italic">Hidden</span>
                      ) : (
                        test.expected
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] whitespace-pre-wrap max-w-37.5 break-all">
                      {test.stderr ? (
                        <span className="text-accent-orange">{test.stderr}</span>
                      ) : test.isHidden ? (
                        <span className="opacity-40 italic">Hidden</span>
                      ) : (
                        <span
                          className={cn(
                            !isPassed ? "text-accent-red" : "text-accent-green",
                          )}
                        >
                          {test.received}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
