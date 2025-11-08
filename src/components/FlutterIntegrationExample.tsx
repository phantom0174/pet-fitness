/**
 * Example component demonstrating Flutter WebView integration
 * 
 * This component shows how to:
 * 1. Get location from Flutter app (with web GPS fallback)
 * 2. Handle general Flutter app messages
 * 3. Request user info from Flutter app
 */

import { useState } from 'react';
import { useFlutterLocation } from '@/hooks/useFlutterLocation';
import { useHandleConnectionData } from '@/hooks/useHandleConnectionData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function FlutterIntegrationExample() {
  const { location, isLoading, error, requestLocation } = useFlutterLocation({ debug: true });
  const [userInfo, setUserInfo] = useState<any>(null);

  // Handle messages from Flutter app
  const handleFlutterMessage = (event: { data: string }) => {
    try {
      const response = JSON.parse(event.data);
      console.log('Received from Flutter app:', response);

      // Handle different message types
      switch (response.name) {
        case 'userinfo':
          setUserInfo(response.data);
          break;
        case 'location':
          // Already handled by useFlutterLocation hook
          break;
        default:
          console.log('Unknown message type:', response.name);
      }
    } catch (e) {
      console.error('Failed to parse Flutter message:', e);
    }
  };

  // Register Flutter message listener
  useHandleConnectionData(handleFlutterMessage);

  // Request user info from Flutter app
  const requestUserInfo = () => {
    const win = window as any;
    if (typeof win.flutterObject !== 'undefined' && win.flutterObject) {
      const message = JSON.stringify({ name: 'userinfo', data: null });
      win.flutterObject.postMessage(message);
    } else {
      alert('Not running in Flutter WebView');
    }
  };

  // Request location
  const handleGetLocation = async () => {
    try {
      const coords = await requestLocation();
      console.log('Got location:', coords);
      alert(`緯度: ${coords.latitude}, 經度: ${coords.longitude}`);
    } catch (err) {
      alert(`定位失敗: ${err}`);
    }
  };

  // Check if running in Flutter WebView
  const win = window as any;
  const isFlutterWebView = typeof win.flutterObject !== 'undefined' && win.flutterObject;

  return (
    <div className="p-4 space-y-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Flutter WebView Integration Demo</h2>
        
        <div className="space-y-2 mb-4">
          <p className="text-sm text-muted-foreground">
            環境: {isFlutterWebView ? '✅ Flutter WebView' : '❌ 一般瀏覽器'}
          </p>
        </div>

        <div className="space-y-3">
          {/* Location */}
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">定位功能</h3>
            <Button 
              onClick={handleGetLocation} 
              disabled={isLoading}
              className="mb-2"
            >
              {isLoading ? '取得定位中...' : '取得定位'}
            </Button>
            
            {location && (
              <div className="text-sm mt-2">
                <p>✅ 緯度: {location.latitude.toFixed(6)}</p>
                <p>✅ 經度: {location.longitude.toFixed(6)}</p>
                {location.accuracy && <p>精確度: {location.accuracy.toFixed(2)}m</p>}
              </div>
            )}
            
            {error && (
              <p className="text-sm text-red-500 mt-2">❌ {error}</p>
            )}
          </div>

          {/* User Info */}
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">使用者資訊</h3>
            <Button 
              onClick={requestUserInfo}
              disabled={!isFlutterWebView}
              variant="outline"
              className="mb-2"
            >
              取得使用者資訊
            </Button>
            
            {userInfo && (
              <div className="text-sm mt-2">
                <p>✅ User ID: {userInfo.id}</p>
                <p>✅ Name: {userInfo.name || 'N/A'}</p>
                <p>✅ Email: {userInfo.email || 'N/A'}</p>
              </div>
            )}
            
            {!isFlutterWebView && (
              <p className="text-sm text-muted-foreground mt-2">
                （需在 Flutter App 中才能使用）
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted rounded text-xs">
          <p className="font-medium mb-1">說明：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>定位功能會優先使用 Flutter App 定位，若失敗則回退到網頁 GPS</li>
            <li>使用者資訊僅在 Flutter WebView 中可用</li>
            <li>所有通訊都是非同步的，並有超時保護</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default FlutterIntegrationExample;
