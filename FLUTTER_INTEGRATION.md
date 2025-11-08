# Flutter WebView 整合指南

本專案支援同時作為 Web 應用和 Flutter WebView 運行。當在 Flutter WebView 中運行時，會優先使用 Flutter 原生功能；在一般瀏覽器中運行時，則使用 Web API。

## 架構概述

Flutter WebView 會為我們全域宣告 `flutterObject`，我們可以透過這個物件與 Flutter App 進行雙向通訊。

### 核心 Hooks

#### 1. `useHandleConnectionData`

處理來自 Flutter App 的訊息。

**路徑**: `src/hooks/useHandleConnectionData.ts`

**用法**:
```tsx
import { useHandleConnectionData } from '@/hooks/useHandleConnectionData';

// 定義處理函數
const handleAppMessage = (event: { data: string }) => {
  const result = JSON.parse(event.data);
  console.log('收到來自 App 的資料:', result);
};

// 註冊監聽器
useHandleConnectionData(handleAppMessage);
```

**重要提醒**:
- 建議在 `/pages` 層級呼叫此 hook，每個頁面只呼叫一次
- 避免在 `/components` 層級呼叫，以免監聽器重複創建造成非預期錯誤
- 該頁面所需的所有 App 資料都應在頁面層級統一處理

#### 2. `useFlutterLocation`

取得定位資訊的混合式 hook，優先使用 Flutter App 定位，若不可用則回退到瀏覽器 GPS。

**路徑**: `src/hooks/useFlutterLocation.ts`

**用法**:
```tsx
import { useFlutterLocation } from '@/hooks/useFlutterLocation';

function MyComponent() {
  const { location, isLoading, error, requestLocation } = useFlutterLocation({
    debug: true, // 開啟除錯模式
    timeout: 3000, // Flutter App 回應超時時間 (ms)
    webGpsTimeout: 10000, // Web GPS 超時時間 (ms)
  });

  const handleGetLocation = async () => {
    try {
      const coords = await requestLocation();
      console.log('取得定位:', coords);
      // coords 包含: latitude, longitude, accuracy, altitude 等
    } catch (err) {
      console.error('定位失敗:', err);
    }
  };

  return (
    <button onClick={handleGetLocation} disabled={isLoading}>
      {isLoading ? '取得定位中...' : '取得定位'}
    </button>
  );
}
```

**回傳值**:
- `location`: 最近一次取得的定位資料
- `isLoading`: 是否正在取得定位
- `error`: 錯誤訊息（如有）
- `requestLocation()`: 請求定位的非同步函數

**定位策略**:
1. 檢測是否在 Flutter WebView 環境中（檢查 `flutterObject` 是否存在）
2. 若存在，向 Flutter App 請求定位
3. 設定超時時間（預設 3 秒），若超時則自動回退到 Web GPS
4. 若 Flutter App 不存在或請求失敗，直接使用 Web GPS
5. Web GPS 也有獨立的超時設定（預設 10 秒）

## Flutter App 通訊協定

### 訊息格式

所有訊息都使用 JSON 格式，並透過 `flutterObject.postMessage()` 傳送：

```typescript
{
  name: string;  // 訊息類型
  data: any;     // 訊息資料
}
```

### 支援的訊息類型

#### 1. 取得使用者資訊

**請求**:
```typescript
flutterObject.postMessage(JSON.stringify({
  name: 'userinfo',
  data: null
}));
```

**回應**:
```typescript
{
  name: 'userinfo',
  data: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    // ... 其他使用者資料
  }
}
```

**React 使用範例**:
```tsx
const handleUserInfo = (event: { data: string }) => {
  const result: { name: string; data: User } = JSON.parse(event.data);
  
  if (result.name === 'userinfo') {
    setUser(result.data);
  }
};

useHandleConnectionData(handleUserInfo);

// 請求使用者資訊
if (typeof flutterObject !== 'undefined') {
  flutterObject.postMessage(JSON.stringify({ 
    name: 'userinfo', 
    data: null 
  }));
}
```

#### 2. 取得定位資訊

**請求**:
```typescript
flutterObject.postMessage(JSON.stringify({
  name: 'location',
  data: null
}));
```

**回應**:
```typescript
{
  name: 'location',
  data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  }
}
```

**React 使用範例**:
```tsx
// 直接使用 useFlutterLocation hook（推薦）
const { requestLocation } = useFlutterLocation();
const coords = await requestLocation();

// 或手動處理
const handleLocation = (event: { data: string }) => {
  const result = JSON.parse(event.data);
  
  if (result.name === 'location') {
    console.log('緯度:', result.data.latitude);
    console.log('經度:', result.data.longitude);
  }
};

useHandleConnectionData(handleLocation);

if (typeof flutterObject !== 'undefined') {
  flutterObject.postMessage(JSON.stringify({ 
    name: 'location', 
    data: null 
  }));
}
```

## 實際應用範例

### Exercise.tsx 中的天氣偵測

在 `src/pages/Exercise.tsx` 中，我們使用混合式定位來偵測天氣：

```tsx
import { useFlutterLocation } from '@/hooks/useFlutterLocation';

const Exercise: React.FC = () => {
  const { requestLocation } = useFlutterLocation({ debug: true });
  
  const detectWeatherNow = async () => {
    setWeatherChecking(true);
    
    try {
      // 優先使用 Flutter App 定位，否則使用瀏覽器 GPS
      const coords = await requestLocation();
      
      // 使用取得的座標請求天氣資料
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&hourly=precipitation`;
      const res = await fetch(url);
      // ... 處理天氣資料
    } catch (err) {
      toast.error('取得天氣資訊失敗');
    }
  };
  
  // 頁面載入時自動偵測天氣
  useEffect(() => {
    detectWeatherNow();
  }, []);
};
```

## 環境偵測

檢查是否在 Flutter WebView 中運行：

```typescript
const isFlutterWebView = typeof flutterObject !== 'undefined' && flutterObject;

if (isFlutterWebView) {
  console.log('在 Flutter App 中運行');
  // 使用 Flutter 原生功能
} else {
  console.log('在一般瀏覽器中運行');
  // 使用 Web API
}
```

## 除錯技巧

### 1. 開啟除錯模式

在 hooks 中啟用 debug 選項：

```tsx
const { requestLocation } = useFlutterLocation({ debug: true });
```

這會在 console 中輸出詳細的執行流程。

### 2. 檢查 flutterObject

在瀏覽器 console 中：

```javascript
// 檢查 flutterObject 是否存在
console.log(typeof flutterObject);

// 檢查可用方法
console.log(flutterObject);
```

### 3. 測試訊息傳送

在 console 中手動測試：

```javascript
// 測試請求定位
flutterObject.postMessage(JSON.stringify({
  name: 'location',
  data: null
}));

// 監聽回應
flutterObject.addEventListener('message', (event) => {
  console.log('收到回應:', event.data);
});
```

## 注意事項

1. **TypeScript 支援**: `flutterObject` 是由 Flutter WebView 全域注入的，因此需要使用 `// @ts-ignore` 來避免 TypeScript 錯誤。

2. **非同步處理**: 所有與 Flutter App 的通訊都是非同步的，務必正確處理 Promise 和錯誤。

3. **超時處理**: 建議為所有請求設定合理的超時時間，避免無限等待。

4. **回退機制**: 永遠要準備回退方案（如使用 Web API），確保在一般瀏覽器中也能正常運作。

5. **效能考量**: 避免頻繁請求定位或其他資源密集的操作。

6. **權限處理**: 在 Flutter App 中可能需要額外的權限設定（如定位權限），請確認 App 端已正確配置。

## 相關連結

- [TownPass 雙向連接文件](https://townpass.taipei/docs/two-way-connection/app_method.html)
- [TownPass 官方文件](https://townpass.taipei/docs/)

## 未來擴展

可以根據需要新增更多 Flutter App 功能的整合，例如：

- 相機拍照
- 檔案存取
- 推播通知
- 分享功能
- 生物辨識

只需遵循相同的模式：建立對應的 hook，處理訊息通訊，並提供回退機制。
