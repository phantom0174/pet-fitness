import { useState, useCallback, useRef } from 'react';

// 定義位置資訊的型別
export interface LocationResponse {
    success: boolean;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp?: string;
    error?: string;
    message?: string;
}

export interface UseLocationReturn {
    location: LocationResponse | null;
    loading: boolean;
    error: string | null;
    getLocation: () => Promise<LocationResponse | null>;
}

/**
 * Custom hook for getting device location via TownPass flutterObject
 * Falls back to browser geolocation API if flutterObject is not available
 */
export const useLocation = (): UseLocationReturn => {
    const [location, setLocation] = useState<LocationResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const cleanup = useCallback(() => {
        if (listenerRef.current && window.flutterObject) {
            window.flutterObject.removeEventListener('message', listenerRef.current);
            listenerRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const getLocation = useCallback(async (): Promise<LocationResponse | null> => {
        setLoading(true);
        setError(null);

        // 先嘗試使用 TownPass flutterObject
        if (typeof window.flutterObject !== 'undefined') {
            return new Promise((resolve) => {
                cleanup();

                const handleMessage = (event: MessageEvent) => {
                    try {
                        console.log('Location raw event.data:', event.data);
                        const response = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                        console.log('Location parsed response:', response);

                        // 確認是 location 的回應
                        if (response.name === 'location') {
                            cleanup();

                            let locationData = response.data;
                            console.log('Location data before parsing:', locationData);

                            // If data is a string, parse it
                            if (typeof locationData === 'string') {
                                locationData = JSON.parse(locationData);
                            }

                            console.log('Location data after parsing:', locationData);

                            // Check if location was successful
                            if (locationData && locationData.success) {
                                const result: LocationResponse = {
                                    success: true,
                                    latitude: locationData.latitude,
                                    longitude: locationData.longitude,
                                    accuracy: locationData.accuracy,
                                    altitude: locationData.altitude,
                                    heading: locationData.heading,
                                    speed: locationData.speed,
                                    timestamp: locationData.timestamp,
                                };
                                console.log('位置資訊 (TownPass):', result);
                                setLocation(result);
                                setLoading(false);
                                resolve(result);
                            } else {
                                const errorMsg = locationData?.message || locationData?.error || '獲取位置失敗';
                                console.error('TownPass 獲取位置失敗:', errorMsg, locationData);
                                setError(errorMsg);
                                setLoading(false);
                                resolve(null);
                            }
                        }
                    } catch (err) {
                        console.error('解析位置回應失敗:', err);
                        setError('解析位置資訊失敗');
                        setLoading(false);
                        cleanup();
                        resolve(null);
                    }
                };

                listenerRef.current = handleMessage;
                window.flutterObject.addEventListener('message', handleMessage);

                // 設定超時
                timeoutRef.current = window.setTimeout(() => {
                    console.warn('位置請求超時');
                    setError('請求超時');
                    setLoading(false);
                    cleanup();
                    resolve(null);
                }, 10000);

                // 發送請求
                try {
                    const message = JSON.stringify({ name: 'location', data: null });
                    console.log('Sending location request:', message);
                    window.flutterObject.postMessage(message);
                } catch (err) {
                    console.error('發送位置請求失敗:', err);
                    setError('發送位置請求失敗');
                    setLoading(false);
                    cleanup();
                    resolve(null);
                }
            });
        }

        // Fallback: 使用瀏覽器的 Geolocation API
        else {
            console.log('TownPass 不可用，使用瀏覽器 Geolocation API');

            if (!navigator.geolocation) {
                const errorMsg = '您的瀏覽器不支援定位功能';
                setError(errorMsg);
                setLoading(false);
                return null;
            }

            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const locationData: LocationResponse = {
                            success: true,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            altitude: position.coords.altitude || undefined,
                            heading: position.coords.heading || undefined,
                            speed: position.coords.speed || undefined,
                            timestamp: new Date(position.timestamp).toISOString(),
                        };

                        console.log('位置資訊 (Browser):', locationData);
                        setLocation(locationData);
                        setLoading(false);
                        resolve(locationData);
                    },
                    (err) => {
                        let errorMsg = '獲取位置失敗';
                        switch (err.code) {
                            case err.PERMISSION_DENIED:
                                errorMsg = '位置權限被拒絕';
                                break;
                            case err.POSITION_UNAVAILABLE:
                                errorMsg = '位置資訊不可用';
                                break;
                            case err.TIMEOUT:
                                errorMsg = '獲取位置超時';
                                break;
                        }

                        console.error('Geolocation 錯誤:', err);
                        setError(errorMsg);
                        setLoading(false);
                        resolve(null);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            });
        }
    }, [cleanup]);

    return {
        location,
        loading,
        error,
        getLocation,
    };
};
