/**
 * Simplified useTownPassAuth hook for TownPass flutterObject integration
 */

import { useCallback, useRef, useState } from "react";

export type TownPassUser = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  token?: string;
  [key: string]: unknown;
};

export function useTownPassAuth(opts?: { debug?: boolean; timeout?: number }) {
  const debug = opts?.debug ?? false;
  const timeoutMs = opts?.timeout ?? 10000;

  const [user, setUser] = useState<TownPassUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) console.debug("[TownPassAuth]", ...args);
    },
    [debug]
  );

  const cleanup = useCallback(() => {
    if (listenerRef.current && window.flutterObject) {
      window.flutterObject.removeEventListener("message", listenerRef.current);
      listenerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const requestTownPassUser = useCallback(async (): Promise<TownPassUser | null> => {
    log("Requesting user info from TownPass...");
    setIsLoading(true);
    setError(null);

    if (!window.flutterObject) {
      const errorMsg = "TownPass flutterObject not available";
      log(errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      return null;
    }

    return new Promise((resolve) => {
      cleanup();

      const handleMessage = (event: MessageEvent) => {
        try {
          log("Received message:", event.data);
          const response = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

          if (response.name === "userinfo") {
            log("Received userinfo:", response.data);
            cleanup();

            let userData = response.data;
            if (typeof userData === "string") {
              userData = JSON.parse(userData);
            }

            setUser(userData);
            setIsLoading(false);
            resolve(userData);
          }
        } catch (err) {
          log("Error parsing response:", err);
          setError("Failed to parse user info");
          setIsLoading(false);
          cleanup();
          resolve(null);
        }
      };

      listenerRef.current = handleMessage;
      window.flutterObject.addEventListener("message", handleMessage);

      timeoutRef.current = window.setTimeout(() => {
        log("Request timed out");
        setError("Request timed out");
        setIsLoading(false);
        cleanup();
        resolve(null);
      }, timeoutMs);

      try {
        const message = JSON.stringify({ name: "userinfo", data: null });
        log("Sending request:", message);
        window.flutterObject.postMessage(message);
      } catch (err) {
        log("Error sending request:", err);
        setError("Failed to send request");
        setIsLoading(false);
        cleanup();
        resolve(null);
      }
    });
  }, [cleanup, log, timeoutMs]);

  const reset = useCallback(() => {
    cleanup();
    setUser(null);
    setIsLoading(false);
    setError(null);
  }, [cleanup]);

  return {
    user,
    isLoading,
    error,
    requestTownPassUser,
    reset,
  };
}
