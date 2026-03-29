import { useCallback, RefObject } from "react";

/**
 * Hook to automatically resize a textarea based on its contents.
 * @param ref The ref of the textarea element to resize.
 * @param maxHeight The maximum height allowed for the textarea.
 */
export function useAutoResizeTextarea(ref: RefObject<HTMLTextAreaElement | null>, maxHeight: number = 250) {
  const adjustHeight = useCallback(() => {
    const textarea = ref.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [ref, maxHeight]);

  return adjustHeight;
}
