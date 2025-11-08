import { useState, useCallback, useRef } from 'react';
import { useHandleConnectionData } from './useHandleConnectionData';

export type LocationCoords = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
};

type LocationResponse = {
  name: 'location';
  data: LocationCoords;
};

/**
 * Hook to get location from Flutter app (priority) or web GPS (fallback)
 * 
 * Usage:
 * ```tsx
 * const { location, isLoading, error, requestLocation } = useFlutterLocation();
 * 
 * // Request location
 * const coords = await requestLocation();
 * ```
 */
export const useFlutterLocation = (options?: {
  debug?: boolean;
  timeout?: number; // Timeout for Flutter app response (ms), default 3000
  webGpsTimeout?: number; // Timeout for web GPS (ms), default 10000
}) => {
  const debug = options?.debug ?? false;
  const flutterTimeout = options?.timeout ?? 3000;
  const webGpsTimeout = options?.webGpsTimeout ?? 10000;

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveRef = useRef<((coords: LocationCoords) => void) | null>(null);
  const rejectRef = useRef<((error: string) => void) | null>(null);
  const timerRef = useRef<number | null>(null);

  const log = useCallback((...args: any[]) => {
    if (debug) console.debug('[useFlutterLocation]', ...args);
  }, [debug]);

  // Cleanup timer
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle Flutter location response
  const handleFlutterLocation = useCallback((event: { data: string }) => {
    try {
      const response: LocationResponse = JSON.parse(event.data);
      
      if (response.name === 'location' && response.data) {
        log('Received location from Flutter app:', response.data);
        
        const coords = response.data;
        setLocation(coords);
        setIsLoading(false);
        setError(null);
        
        // Resolve promise
        if (resolveRef.current) {
          resolveRef.current(coords);
          resolveRef.current = null;
          rejectRef.current = null;
        }
        
        cleanup();
      }
    } catch (e) {
      log('Failed to parse Flutter location response:', e);
    }
  }, [log, cleanup]);

  // Register Flutter message listener
  useHandleConnectionData(handleFlutterLocation);

  // Fallback: Web GPS
  const getWebLocation = useCallback((): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('瀏覽器不支援定位功能');
        return;
      }

      log('Requesting location from web GPS...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
          };
          
          log('Received location from web GPS:', coords);
          resolve(coords);
        },
        (err) => {
          log('Web GPS error:', err.message);
          reject(`無法取得定位：${err.message}`);
        },
        {
          timeout: webGpsTimeout,
          enableHighAccuracy: true,
          maximumAge: 0,
        }
      );
    });
  }, [log, webGpsTimeout]);

  // Main function to request location
  const requestLocation = useCallback(async (): Promise<LocationCoords> => {
    log('Requesting location...');
    setIsLoading(true);
    setError(null);
    cleanup();

    return new Promise<LocationCoords>(async (resolve, reject) => {
      // Check if Flutter app is available
      const win = window as any;
      const hasFlutterObject = typeof win.flutterObject !== 'undefined' && win.flutterObject;

      if (hasFlutterObject) {
        log('Flutter app detected, requesting location from app...');
        
        // Store resolve/reject for Flutter callback
        resolveRef.current = resolve;
        rejectRef.current = reject;

        try {
          // Request location from Flutter app
          const message = JSON.stringify({ name: 'location', data: null });
          win.flutterObject.postMessage(message);

          // Set timeout for Flutter response
          timerRef.current = window.setTimeout(async () => {
            log(`Flutter app timeout (${flutterTimeout}ms), falling back to web GPS...`);
            
            // Clear refs
            resolveRef.current = null;
            rejectRef.current = null;

            // Fallback to web GPS
            try {
              const coords = await getWebLocation();
              setLocation(coords);
              setIsLoading(false);
              setError(null);
              resolve(coords);
            } catch (err) {
              const errorMsg = typeof err === 'string' ? err : '無法取得定位';
              log('Web GPS fallback failed:', errorMsg);
              setIsLoading(false);
              setError(errorMsg);
              reject(errorMsg);
            }
          }, flutterTimeout);

        } catch (e) {
          log('Failed to request location from Flutter app:', e);
          
          // Fallback to web GPS immediately on error
          try {
            const coords = await getWebLocation();
            setLocation(coords);
            setIsLoading(false);
            setError(null);
            resolve(coords);
          } catch (err) {
            const errorMsg = typeof err === 'string' ? err : '無法取得定位';
            setIsLoading(false);
            setError(errorMsg);
            reject(errorMsg);
          } finally {
            cleanup();
          }
        }
      } else {
        // No Flutter app, use web GPS directly
        log('No Flutter app detected, using web GPS...');
        
        try {
          const coords = await getWebLocation();
          setLocation(coords);
          setIsLoading(false);
          setError(null);
          resolve(coords);
        } catch (err) {
          const errorMsg = typeof err === 'string' ? err : '無法取得定位';
          setIsLoading(false);
          setError(errorMsg);
          reject(errorMsg);
        } finally {
          cleanup();
        }
      }
    });
  }, [log, flutterTimeout, getWebLocation, cleanup]);

  return {
    location,
    isLoading,
    error,
    requestLocation,
  };
};
