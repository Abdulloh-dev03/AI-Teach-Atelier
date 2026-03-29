"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Paperclip, 
  ArrowUp, 
  Command, 
  ChevronDown 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface ChatInputProps {
  inputValue: string;
  onInputChangeAction: (value: string) => void;
  activeModel: string;
  onModelChangeAction: (model: string) => void;
  onSendMessageAction: () => void;
}

export function ChatInput({
  inputValue,
  onInputChangeAction,
  activeModel,
  onModelChangeAction,
  onSendMessageAction,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useAutoResizeTextarea(textareaRef);

  // Adjust height when input value changes
  useEffect(() => {
    adjustHeight();
  }, [inputValue, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessageAction();
    }
  };

  return (
    <div className="relative bg-background-base my-2 border-border-subtle">
      <div className="max-w-3xl mx-auto relative group">
        <div className="relative bg-surface-card border border-border-subtle rounded-[28px] shadow-2xl transition-all duration-300 focus-within:ring-2 ring-accent/10">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 px-2">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="h-7 px-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border border-border-subtle/50 cursor-pointer"
                  >
                    {activeModel}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-surface-card border-border-subtle">
                  <DropdownMenuItem 
                    onClick={() => onModelChangeAction("qwen")}
                    className="text-[10px] font-black uppercase tracking-[0.2em] transition-colors focus:bg-accent focus:text-white cursor-pointer rounded-lg p-2.5"
                  >
                    Qwen 2.5
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onModelChangeAction("llama")}
                    className="text-[10px] font-black uppercase tracking-[0.2em] transition-colors focus:bg-accent focus:text-white cursor-pointer rounded-lg p-2.5"
                  >
                    Llama 3
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onModelChangeAction("openai")}
                    className="text-[10px] font-black uppercase tracking-[0.2em] transition-colors focus:bg-accent focus:text-white cursor-pointer rounded-lg p-2.5"
                  >
                    GPT-4o
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="h-4 w-px bg-border-subtle" />
              <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">Context Ready</span>
            </div>

            <div className="flex items-end gap-3 px-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => onInputChangeAction(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Friday AI..."
                rows={1}
                className="flex-1 bg-transparent outline-none text-[16px] placeholder:text-text-secondary/40 resize-none max-h-62.5 py-2 leading-relaxed custom-scrollbar"
                style={{ minHeight: "44px" }}
              />
              
              <div className="flex items-center gap-2 pb-1.5">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-text-secondary hover:text-text-primary hover:bg-accent/5 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Button 
                  size="icon" 
                  onClick={onSendMessageAction}
                  className="h-10 w-10 rounded-2xl cursor-pointer"
                >
                  <ArrowUp className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="mt-4 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 group/status">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--accent),0.5)]" />
            <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest group-hover/status:text-text-secondary transition-colors">Systems Optimal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-mono text-text-secondary/40">
              <Command className="w-3 h-3" />
              <span>+ ENTER TO SEND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
