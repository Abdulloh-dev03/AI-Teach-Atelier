import { useEffect, RefObject } from "react";

/**
 * Hook to automatically scroll a container to the bottom when dependencies change.
 * @param ref The ref of the container element to scroll.
 * @param dependencies The dependency array that triggers the scroll.
 */
export function useAutoScroll(ref: RefObject<HTMLDivElement | null>, dependencies: any[]) {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [dependencies]);
}
