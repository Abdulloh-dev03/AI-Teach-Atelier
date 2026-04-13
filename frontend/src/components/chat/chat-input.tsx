"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, ArrowUp, ChevronDown, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { useUploadImageMutation } from "@/store/cloudinaryApi";

interface ChatInputProps {
  inputValue: string;
  onInputChangeAction: (value: string) => void;
  activeModel: string;
  onModelChangeAction: (model: string) => void;
  onSendMessageAction: (imageUrl?: string) => void;
}

export function ChatInput({
  inputValue,
  onInputChangeAction,
  activeModel,
  onModelChangeAction,
  onSendMessageAction,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  const adjustHeight = useAutoResizeTextarea(textareaRef);

  useEffect(() => {
    adjustHeight();
  }, [inputValue, adjustHeight]);

  const handleImageSelect = async (file: File) => {
    try {
      const url = await uploadImage(file).unwrap();
      setImageUrl(url);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
  };

  const handleSend = () => {
    onSendMessageAction(imageUrl || undefined);
    setImageUrl(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative bg-background-base my-3 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-surface-card border border-border-subtle rounded-3xl p-2 shadow-sm">
          {/* Image Preview / Loading Area */}
          {(imageUrl || isUploading) && (
            <div className="p-2 pb-0 flex">
              <div className="relative group">
                {isUploading ? (
                  // 1. LOADING SQUARE
                  <div className="w-28 h-28 aspect-square rounded-2xl border border-dashed border-border-subtle bg-accent/5 flex flex-col items-center justify-center gap-2 animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    <span className="text-[10px] font-medium text-text-secondary">
                      Uploading...
                    </span>
                  </div>
                ) : (
                  // 2. SQUARE IMAGE PREVIEW
                  <>
                    <div
                      className="w-28 h-28 aspect-square overflow-hidden rounded-2xl border border-border-subtle shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      <img
                        src={imageUrl!}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-background-base border border-border-subtle text-text-primary rounded-full p-1 shadow-md hover:bg-surface-card transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 p-1">
            {/* Paperclip */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-2xl shrink-0 dark:bg-transparent dark:hover:bg-transparent text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => onInputChangeAction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Friday AI..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none resize-none max-h-40 text-base py-2"
              rows={1}
            />

            {/* Model + Send - Right */}
            <div className="flex items-center gap-2 shrink-0 pb-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl text-[12px] italic font-serif px-2 text-secondary cursor-pointer"
                  >
                    {activeModel}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl bg-[#fcf9f2] dark:bg-[#14181d]">
                  <DropdownMenuItem onClick={() => onModelChangeAction("kimi")} className="hover:text-white cursor-pointer dark:hover:text-black">
                    Kimi K2.5
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onModelChangeAction("qwen")} className="hover:text-white cursor-pointer dark:hover:text-black">
                    Qwen 3.5
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onModelChangeAction("gemma")} className="hover:text-white cursor-pointer dark:hover:text-black"
                  >
                    Gemma
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleSend}
                disabled={isUploading || !inputValue.trim()}
                className="h-8 w-8 rounded-xl bg-accent hover:bg-accent/90 p-0"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-center text-text-secondary/50 mt-2">
          Friday can make mistakes. Check important info.
        </div>
      </div>

      {/* Full Image Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] p-0 bg-transparent border-none flex items-center justify-center outline-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={imageUrl || ""}
              alt="Full preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <DialogClose asChild>
              <Button
                variant="secondary"
                size="icon"
                className="absolute -top-12 right-0 md:-right-12 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md cursor-pointer"
              >
                <X size={20} />
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          e.target.files?.[0] && handleImageSelect(e.target.files[0])
        }
      />
    </div>
  );
}
