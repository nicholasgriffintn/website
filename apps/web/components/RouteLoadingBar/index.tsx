import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";

import { cn } from "@/lib/utils";

const SHOW_DELAY_MS = 120;
const MIN_VISIBLE_MS = 220;

export function RouteLoadingBar() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle" && Boolean(navigation.location);

  const [isVisible, setIsVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current !== null) {
        window.clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isNavigating) {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (!isVisible && showTimeoutRef.current === null) {
        showTimeoutRef.current = window.setTimeout(() => {
          shownAtRef.current = Date.now();
          setIsVisible(true);
          showTimeoutRef.current = null;
        }, SHOW_DELAY_MS);
      }

      return;
    }

    if (showTimeoutRef.current !== null) {
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (!isVisible) {
      return;
    }

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : MIN_VISIBLE_MS;
    const remainingVisibleMs = Math.max(0, MIN_VISIBLE_MS - elapsed);

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      shownAtRef.current = null;
      hideTimeoutRef.current = null;
    }, remainingVisibleMs);
  }, [isNavigating, isVisible]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="route-loading-bar h-full w-[40%] bg-gradient-to-r from-sky-300/20 via-sky-300 to-sky-200/20" />
    </div>
  );
}
