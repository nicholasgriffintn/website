import { useCallback, useEffect, useState } from "react";

export function useOpenFeature() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkOpenFeature = () => {
      if (typeof window !== "undefined" && window.BeaconOpenFeature) {
        setIsReady(true);
        return true;
      }
      return false;
    };

    if (!checkOpenFeature()) {
      const interval = setInterval(() => {
        if (checkOpenFeature()) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  const waitForOpenFeature = useCallback(async () => {
    if (isReady) return;

    return new Promise<void>((resolve) => {
      const check = () => {
        if (typeof window !== "undefined" && window.BeaconOpenFeature) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }, [isReady]);

  const getObjectDetails = useCallback(
    async (
      flagKey: string,
      defaultValue: Record<string, string>,
      context?: Record<string, unknown>,
    ) => {
      await waitForOpenFeature();
      return window.BeaconOpenFeature?.getObjectDetails(flagKey, defaultValue, context);
    },
    [waitForOpenFeature],
  );

  const track = useCallback(
    async (
      trackingEventName: string,
      context?: Record<string, unknown>,
      details?: Record<string, unknown>,
    ) => {
      await waitForOpenFeature();
      return window.BeaconOpenFeature?.track(trackingEventName, context, details);
    },
    [waitForOpenFeature],
  );

  return {
    getObjectDetails,
    track,
    isReady,
  };
}
