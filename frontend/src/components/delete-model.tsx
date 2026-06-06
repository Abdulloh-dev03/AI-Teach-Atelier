"use client"

import { useDeleteProblemMutation } from "@/store/problemApi";
import { Button } from "./ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "./ui/dialog";
import { useState } from "react";
import { AlertCircle, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DeleteModalProps {
  problemId: string;
  problemTitle: string;
  trigger?: React.ReactNode;
}

/**
 * Scholar Canvas Design System — Deletion Protocol Modal
 * 
 * Aesthetics:
 * - Surface: Tonal elevation with subtle glassmorphism
 * - Palette: Destructive Rose-500 accents
 * - Typography: High-fidelity tracking and bold weights
 */
export function DeleteModal({ problemId, problemTitle, trigger }: DeleteModalProps) {
    const [open, setOpen] = useState(false);
    const [deleteProblem, { isLoading }] = useDeleteProblemMutation();
    
    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            await deleteProblem(problemId).unwrap();
            toast.success("Successfully deleted", {
                description: "The assignment has been removed from the central archive.",
                icon: <Trash2 className="w-4 h-4 text-emerald-500" />
            });
            setOpen(false);
        } catch (error) {
            toast.error("Execution failure", {
                description: "Failed to purge algorithm. Database connection might be unstable.",
            });
            console.error("Delete error:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                {trigger || (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 px-4 rounded-xl gap-2 font-bold text-destructive border-destructive/20 hover:bg-destructive/10 transition-all border-0 shadow-[inset_0_0_0_1px_rgba(186,26,26,0.1)]"
                    >
                        <Trash2 className="w-4 h-4" />
                        Purge Assignment
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent 
                className={cn(
                    "sm:max-w-105 bg-surface-card/95 backdrop-blur-xl rounded-4xl border-0 shadow-(--shadow-ambient-elevated) p-0 overflow-hidden ring-1 ring-border-subtle/50",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}
            >
                <div className="relative p-8">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <ShieldAlert className="w-32 h-32 text-destructive" />
                    </div>

                    <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mb-8 shadow-[0_8px_24px_rgba(186,26,26,0.1)]">
                        <AlertCircle className="w-7 h-7 text-destructive" />
                    </div>
                    
                    <DialogHeader className="text-left mb-8">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-text-primary leading-tight">
                            Protocol: Deletion <br />
                            <span className="text-destructive font-serif italic text-xl opacity-90 underline decoration-destructive/20 underline-offset-4">Security Override Required</span>
                        </DialogTitle>
                        <DialogDescription className="text-base text-text-secondary opacity-70 leading-relaxed pt-4 font-medium">
                            You are about to permanently erase <span className="font-bold text-text-primary px-1.5 py-0.5 bg-surface-elevated rounded-md ring-1 ring-border-subtle/50">"{problemTitle}"</span>. This action is irreversible.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <Button 
                            variant="ghost" 
                            onClick={() => setOpen(false)}
                            className="flex-1 h-13 rounded-2xl font-bold text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all duration-300 cursor-pointer"
                            disabled={isLoading}
                        >
                            Abort
                        </Button>
                        <Button 
                            onClick={handleDelete}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 h-13 rounded-2xl font-bold  text-white  active:scale-[0.98] transition-all duration-300 cursor-pointer",
                                isLoading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Deleting…</span>
                                </div>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}