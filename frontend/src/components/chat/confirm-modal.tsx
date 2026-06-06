import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isCurrentChat?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  isCurrentChat = false,
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const router = useRouter();
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      if (isCurrentChat) {
        router.push("/chat");
      } else {
        router.refresh();
      }
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-100 border-border-subtle bg-surface-card p-6 shadow-2xl rounded-2xl sm:max-w-105">
        <DialogHeader className="gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-text-primary">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-text-secondary/70 leading-relaxed mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3 sm:flex-row sm:justify-end border-none bg-transparent p-0">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-widest text-text-secondary hover:bg-black/5 hover:text-text-primary rounded-xl h-11 cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 sm:flex-none rounded-xl h-11 px-6 text-xs font-bold uppercase tracking-widest cursor-pointer bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
