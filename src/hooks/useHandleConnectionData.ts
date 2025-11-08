import { useEffect, useRef } from 'react';

/**
 * React hook for handling Flutter WebView messages
 * 
 * @param cb - Callback to handle data from the app. Receives an event object where event.data contains the app's response as a string
 * 
 * <strong>Important Note:</strong> It's recommended to call this hook in page components (/pages), 
 * only once per page. Handle all app data needed for that page within the page component,
 * rather than calling it in child components (/components) to avoid duplicate listeners and unexpected errors.
 */
export const useHandleConnectionData = (cb?: (event: { data: string }) => void) => {
  const callbackRef = useRef(cb);

  // Update callback ref when cb changes
  useEffect(() => {
    callbackRef.current = cb;
  }, [cb]);

  useEffect(() => {
    const win = window as any;
    
    if (typeof win.flutterObject !== 'undefined' && win.flutterObject) {
      if (callbackRef.current) {
        const handler = (event: { data: string }) => {
          callbackRef.current?.(event);
        };

        win.flutterObject.addEventListener('message', handler);

        return () => {
          win.flutterObject?.removeEventListener('message', handler);
        };
      }
    }
  }, []); // Empty deps - handler is stable via ref

  return;
};
