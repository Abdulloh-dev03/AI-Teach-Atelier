"use client";

import { useDeleteAllProblemsMutation } from "@/store/problemApi";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteAllButtonProps {
  disabled?: boolean;
}

export function DeleteAllButton({ disabled }: DeleteAllButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleteAllProblems, { isLoading }] = useDeleteAllProblemsMutation();

  const handleDeleteAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await deleteAllProblems().unwrap();
      toast.success("All problems deleted successfully");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to delete problems");
      console.error("Delete all error:", error);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={disabled || isLoading}
            className="flex items-center gap-2 h-10 px-4 rounded-xl font-bold transition-all duration-300 shadow-sm cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete All
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-surface-card border border-border-subtle shadow-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-text-primary">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              This action cannot be undone. This will permanently delete all your problems.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="rounded-xl border-border-subtle bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isLoading}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <span className="text-[10px] text-text-secondary opacity-60 font-medium uppercase tracking-wider">
        This action is irreversible
      </span>
    </div>
  );
}
