/**
 * Flutter WebView 測試頁面
 * 用於在本地瀏覽器中模擬和測試 Flutter WebView 功能
 */

import { useState, useEffect } from 'react';
import { useFlutterLocation } from '@/hooks/useFlutterLocation';
import { useHandleConnectionData } from '@/hooks/useHandleConnectionData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MapPin, User, Code, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FlutterTest() {
  const navigate = useNavigate();
  const { location, isLoading, error, requestLocation } = useFlutterLocation({ debug: true });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [messages, setMessages] = useState<string[]>([]);
  
  // 檢查是否在 Flutter WebView 環境
  const win = window as any;
  const isFlutterWebView = typeof win.flutterObject !== 'undefined' && win.flutterObject;

  // 處理來自 Flutter App 的訊息
  const handleFlutterMessage = (event: { data: string }) => {
    try {
      const response = JSON.parse(event.data);
      const timestamp = new Date().toLocaleTimeString();
      setMessages(prev => [`[${timestamp}] 收到訊息: ${JSON.stringify(response)}`, ...prev.slice(0, 9)]);

      switch (response.name) {
        case 'userinfo':
          setUserInfo(response.data);
          break;
        case 'location':
          // 已由 useFlutterLocation 處理
          break;
      }
    } catch (e) {
      console.error('解析訊息失敗:', e);
    }
  };

  useHandleConnectionData(handleFlutterMessage);

  // 模擬 Flutter App（用於本地測試）
  useEffect(() => {
    if (!isFlutterWebView) {
      console.log('💡 本地測試模式：可以在 Console 中執行測試命令');
    }
  }, [isFlutterWebView]);

  // 請求使用者資訊
  const handleRequestUserInfo = () => {
    if (isFlutterWebView) {
      win.flutterObject.postMessage(JSON.stringify({ name: 'userinfo', data: null }));
    } else {
      alert('請在 Console 中執行測試命令來模擬 Flutter 回應');
      console.log('💡 複製以下命令到 Console 執行：');
      console.log(`
window.dispatchEvent(new MessageEvent('message', {
  data: JSON.stringify({
    name: 'userinfo',
    data: {
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com'
    }
  })
}));
      `);
    }
  };

  // 請求定位
  const handleRequestLocation = async () => {
    try {
      const coords = await requestLocation();
      setMessages(prev => [
        `[${new Date().toLocaleTimeString()}] ✅ 定位成功: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
        ...prev.slice(0, 9)
      ]);
    } catch (err) {
      setMessages(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ 定位失敗: ${err}`,
        ...prev.slice(0, 9)
      ]);
    }
  };

  // 模擬 Flutter 定位回應（用於測試）
  const simulateFlutterLocation = () => {
    // 使用台北 101 座標
    const mockLocation = {
      name: 'location',
      data: {
        latitude: 25.0330,
        longitude: 121.5654,
        accuracy: 10.0
      }
    };
    
    // 模擬 Flutter 回應
    win.dispatchEvent(new MessageEvent('message', {
      data: JSON.stringify(mockLocation)
    }));
    
    setMessages(prev => [
      `[${new Date().toLocaleTimeString()}] 📍 模擬 Flutter 定位回應`,
      ...prev.slice(0, 9)
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">Flutter WebView 測試</h1>
        </div>

        {/* 環境狀態 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">環境狀態</h2>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              運行環境: {isFlutterWebView ? (
                <span className="text-green-600 font-semibold">✅ Flutter WebView</span>
              ) : (
                <span className="text-orange-600 font-semibold">🌐 瀏覽器 (測試模式)</span>
              )}
            </p>
            <p className="text-sm text-gray-600">
              {isFlutterWebView 
                ? '可以直接使用 Flutter App 功能' 
                : '可以使用模擬功能或在 Console 中測試'}
            </p>
          </div>
        </Card>

        {/* 定位測試 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">定位功能測試</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleRequestLocation} disabled={isLoading}>
                {isLoading ? '取得定位中...' : '請求定位'}
              </Button>
              {!isFlutterWebView && (
                <Button onClick={simulateFlutterLocation} variant="outline">
                  模擬 Flutter 定位
                </Button>
              )}
            </div>

            {location && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ 定位資料</h3>
                <div className="text-sm space-y-1">
                  <p>緯度: {location.latitude.toFixed(6)}</p>
                  <p>經度: {location.longitude.toFixed(6)}</p>
                  {location.accuracy && <p>精確度: ±{location.accuracy.toFixed(2)}m</p>}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">❌ {error}</p>
              </div>
            )}
          </div>
        </Card>

        {/* 使用者資訊測試 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">使用者資訊測試</h2>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleRequestUserInfo}
              disabled={!isFlutterWebView}
              variant={isFlutterWebView ? 'default' : 'outline'}
            >
              請求使用者資訊
            </Button>

            {userInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ 使用者資料</h3>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </div>
            )}

            {!isFlutterWebView && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  💡 在 Console 中貼上測試命令來模擬 Flutter 回應
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* 訊息日誌 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">訊息日誌</h2>
          </div>
          
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
            {messages.length > 0 ? (
              messages.map((msg, i) => (
                <div key={i} className="mb-1">{msg}</div>
              ))
            ) : (
              <div className="text-gray-500">等待訊息...</div>
            )}
          </div>
        </Card>

        {/* 測試說明 */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-4">🧪 本地測試指南</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">方法一：使用模擬按鈕（推薦）</h3>
              <p className="text-gray-700">
                點擊「模擬 Flutter 定位」按鈕可以直接測試定位功能
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">方法二：在 Console 中執行命令</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-700 mb-1">測試定位:</p>
                  <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
{`// 創建模擬的 flutterObject
window.flutterObject = {
  postMessage: (msg) => {
    const request = JSON.parse(msg);
    if (request.name === 'location') {
      window.flutterObject.onmessage({
        data: JSON.stringify({
          name: 'location',
          data: {
            latitude: 25.0330,
            longitude: 121.5654,
            accuracy: 10.0
          }
        })
      });
    }
  },
  addEventListener: (event, handler) => {
    window.flutterObject.onmessage = handler;
  },
  removeEventListener: () => {}
};`}
                  </pre>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-1">測試使用者資訊:</p>
                  <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
{`// 模擬回應使用者資訊
window.flutterObject.onmessage({
  data: JSON.stringify({
    name: 'userinfo',
    data: {
      id: 'test-123',
      name: 'Test User',
      email: 'test@example.com'
    }
  })
});`}
                  </pre>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">方法三：使用 Web GPS（自動回退）</h3>
              <p className="text-gray-700">
                如果沒有 Flutter 環境，系統會自動使用瀏覽器的 GPS 功能
              </p>
            </div>
          </div>
        </Card>

        {/* Debug 資訊 */}
        <Card className="p-6 bg-gray-100">
          <h3 className="font-semibold mb-2">Debug 資訊</h3>
          <div className="text-xs font-mono space-y-1">
            <p>flutterObject 存在: {isFlutterWebView ? '是' : '否'}</p>
            <p>定位載入中: {isLoading ? '是' : '否'}</p>
            <p>定位錯誤: {error || '無'}</p>
            <p>已收到訊息數: {messages.length}</p>
          </div>
          <div className="mt-4 text-xs text-gray-600">
            <p>💡 提示：打開瀏覽器 Console (F12) 查看詳細 debug 日誌</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
