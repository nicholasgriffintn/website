import { useCallback, useState } from "react";

export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);

  const reset = useCallback(() => {
    setToken(null);
    setIsLoading(true);
    setHasError(false);
    setWidgetKey((current) => current + 1);
  }, []);

  const handleVerify = useCallback((nextToken: string) => {
    setToken(nextToken);
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsLoading(true);
  }, []);

  const handleError = useCallback(() => {
    setToken(null);
    setIsLoading(false);
    setHasError(true);
  }, []);

  return {
    token,
    isLoading,
    hasError,
    widgetKey,
    reset,
    handleVerify,
    handleExpire,
    handleError,
  };
}
