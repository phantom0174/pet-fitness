# Flutter WebView 與 Web 雙模式整合 - 實作總結

## 📋 完成項目

✅ 建立 React 版本的 Flutter WebView 通訊 hooks  
✅ 實作混合式定位功能（Flutter App 優先，Web GPS 回退）  
✅ 更新 Exercise 頁面使用新的定位方式  
✅ 建立完整的 TypeScript 類型定義  
✅ 撰寫詳細的整合文件和使用範例  

## 📁 新增/修改的檔案

### 新增檔案

1. **`src/hooks/useHandleConnectionData.ts`**
   - 處理 Flutter WebView 訊息的 React hook
   - 轉換自 Vue 的 `useHandleConnectionData`
   - 使用 `useEffect` 和 `useRef` 管理監聽器生命週期

2. **`src/hooks/useFlutterLocation.ts`**
   - 混合式定位 hook
   - 優先使用 Flutter App 定位
   - 超時後自動回退到網頁 GPS
   - 包含完整的錯誤處理和狀態管理

3. **`src/types/global.d.ts`**
   - Flutter WebView 全域類型定義
   - 定義 `FlutterObject` 介面
   - 擴展 `Window` 介面

4. **`FLUTTER_INTEGRATION.md`**
   - 完整的整合指南文件
   - 包含使用範例和除錯技巧
   - 詳細的 API 說明

5. **`src/components/FlutterIntegrationExample.tsx`**
   - 示範元件
   - 展示所有整合功能的用法
   - 可用於測試和學習

### 修改檔案

1. **`src/pages/Exercise.tsx`**
   - 導入 `useFlutterLocation` hook
   - 更新 `detectWeatherNow()` 函數使用混合式定位
   - 移除直接使用 `navigator.geolocation` 的程式碼

2. **`src/vite-env.d.ts`**
   - 新增 Flutter WebView 類型定義

## 🎯 核心功能

### 1. 混合式定位系統

```tsx
const { location, isLoading, error, requestLocation } = useFlutterLocation({
  debug: true,
  timeout: 3000,          // Flutter App 超時時間
  webGpsTimeout: 10000    // Web GPS 超時時間
});

// 使用
const coords = await requestLocation();
```

**運作流程**:
1. 檢測是否在 Flutter WebView 環境
2. 若是，向 Flutter App 請求定位
3. 等待回應（預設 3 秒超時）
4. 若超時或失敗，自動使用 Web GPS
5. 若不在 Flutter WebView，直接使用 Web GPS

### 2. Flutter 訊息處理

```tsx
const handleMessage = (event: { data: string }) => {
  const response = JSON.parse(event.data);
  
  switch (response.name) {
    case 'userinfo':
      // 處理使用者資訊
      break;
    case 'location':
      // 處理定位資訊
      break;
  }
};

useHandleConnectionData(handleMessage);
```

### 3. 與 Flutter App 通訊

```tsx
// 檢查環境
const win = window as any;
const isFlutterWebView = typeof win.flutterObject !== 'undefined' && win.flutterObject;

// 發送訊息
if (isFlutterWebView) {
  win.flutterObject.postMessage(JSON.stringify({
    name: 'userinfo',  // 或 'location', 等其他類型
    data: null
  }));
}
```

## 🔧 技術細節

### TypeScript 類型定義

```typescript
interface FlutterObject {
  postMessage(message: string): void;
  addEventListener(event: 'message', handler: (event: { data: string }) => void): void;
  removeEventListener(event: 'message', handler: (event: { data: string }) => void): void;
  onmessage?: (event: { data: string }) => void;
}

interface Window {
  flutterObject?: FlutterObject;
}
```

### 訊息格式

**請求**:
```json
{
  "name": "location",  // 或 "userinfo"
  "data": null
}
```

**回應**:
```json
{
  "name": "location",
  "data": {
    "latitude": 25.0330,
    "longitude": 121.5654,
    "accuracy": 10.0
  }
}
```

## 🎨 使用範例

### Exercise 頁面中的天氣偵測

```tsx
import { useFlutterLocation } from '@/hooks/useFlutterLocation';

const Exercise: React.FC = () => {
  const { requestLocation } = useFlutterLocation({ debug: true });
  
  const detectWeatherNow = async () => {
    try {
      // 優先使用 Flutter App 定位，否則使用瀏覽器 GPS
      const coords = await requestLocation();
      
      // 使用座標請求天氣資料
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}`;
      const res = await fetch(url);
      // ... 處理天氣資料
    } catch (err) {
      toast.error('取得天氣資訊失敗');
    }
  };
};
```

## 🐛 除錯方式

### 1. 啟用 Debug 模式

```tsx
const { requestLocation } = useFlutterLocation({ debug: true });
```

在 Console 中會看到詳細的執行日誌：
- `[useFlutterLocation] Requesting location...`
- `[useFlutterLocation] Flutter app detected...`
- `[useFlutterLocation] Received location from Flutter app: {...}`

### 2. 檢查環境

在瀏覽器 Console 中執行：
```javascript
// 檢查 flutterObject 是否存在
console.log(typeof window.flutterObject);

// 查看可用方法
console.log(window.flutterObject);
```

### 3. 手動測試通訊

```javascript
// 測試請求定位
window.flutterObject.postMessage(JSON.stringify({
  name: 'location',
  data: null
}));

// 監聽回應
window.flutterObject.addEventListener('message', (event) => {
  console.log('收到回應:', JSON.parse(event.data));
});
```

## 📝 重要提醒

### 1. Hook 使用位置
- ✅ 在頁面層級（`/pages`）呼叫
- ✅ 每個頁面只呼叫一次
- ❌ 避免在元件層級（`/components`）呼叫

### 2. 錯誤處理
- 所有請求都有超時保護
- 提供完整的回退機制
- 錯誤訊息清楚明確

### 3. 效能考量
- 避免頻繁請求定位
- 使用 `useRef` 避免不必要的重新渲染
- 適當的超時時間設定

### 4. 相容性
- 在 Flutter WebView 中使用 Flutter 原生功能
- 在一般瀏覽器中使用 Web API
- 保證兩種環境都能正常運作

## 🚀 未來擴展

可以根據相同模式新增更多功能：

1. **相機功能**
   ```tsx
   const { capturePhoto } = useFlutterCamera();
   ```

2. **檔案存取**
   ```tsx
   const { pickFile } = useFlutterFilePicker();
   ```

3. **推播通知**
   ```tsx
   const { sendNotification } = useFlutterNotification();
   ```

4. **分享功能**
   ```tsx
   const { share } = useFlutterShare();
   ```

## 📚 參考文件

- [TownPass 雙向連接文件](https://townpass.taipei/docs/two-way-connection/app_method.html)
- [完整整合指南](./FLUTTER_INTEGRATION.md)
- [範例元件](./src/components/FlutterIntegrationExample.tsx)

## ✨ 總結

成功實現了 Flutter WebView 與 Web 的雙模式支援，系統會：

1. ✅ 自動偵測運行環境
2. ✅ 優先使用 Flutter App 原生功能
3. ✅ 自動回退到 Web API
4. ✅ 提供完整的錯誤處理
5. ✅ 保持程式碼簡潔易維護

現在你的應用可以同時在：
- 🌐 一般瀏覽器中運作（使用 Web API）
- 📱 Flutter WebView 中運作（使用原生功能）

兩種環境下都能提供最佳的使用者體驗！
