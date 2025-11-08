# Flutter WebView 快速參考

## 🚀 快速開始

### 1. 取得定位（推薦）

```tsx
import { useFlutterLocation } from '@/hooks/useFlutterLocation';

const { requestLocation } = useFlutterLocation({ debug: true });

// 使用
const coords = await requestLocation();
console.log(coords.latitude, coords.longitude);
```

### 2. 處理 Flutter 訊息

```tsx
import { useHandleConnectionData } from '@/hooks/useHandleConnectionData';

const handleMessage = (event: { data: string }) => {
  const response = JSON.parse(event.data);
  console.log(response.name, response.data);
};

useHandleConnectionData(handleMessage);
```

### 3. 請求使用者資訊

```tsx
const win = window as any;
if (win.flutterObject) {
  win.flutterObject.postMessage(JSON.stringify({
    name: 'userinfo',
    data: null
  }));
}
```

## 📋 支援的訊息類型

| 訊息名稱 | 用途 | 請求格式 | 回應格式 |
|---------|------|---------|---------|
| `location` | 取得定位 | `{ name: 'location', data: null }` | `{ name: 'location', data: { latitude, longitude, ... } }` |
| `userinfo` | 取得使用者資訊 | `{ name: 'userinfo', data: null }` | `{ name: 'userinfo', data: { id, name, email, ... } }` |
| `userid` | 取得使用者 ID | `{ name: 'userid', data: null }` | `{ name: 'userid', data: 'user_id_string' }` |

## 🔧 環境檢測

```tsx
const win = window as any;
const isFlutterWebView = typeof win.flutterObject !== 'undefined' && win.flutterObject;

if (isFlutterWebView) {
  // 使用 Flutter 功能
} else {
  // 使用 Web API
}
```

## 📦 可用 Hooks

### useFlutterLocation

**參數**:
- `debug?: boolean` - 開啟除錯模式（預設: `false`）
- `timeout?: number` - Flutter 超時時間（預設: `3000` ms）
- `webGpsTimeout?: number` - Web GPS 超時時間（預設: `10000` ms）

**回傳**:
- `location: LocationCoords | null` - 最近的定位資料
- `isLoading: boolean` - 是否正在載入
- `error: string | null` - 錯誤訊息
- `requestLocation: () => Promise<LocationCoords>` - 請求定位函數

**LocationCoords**:
```typescript
{
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}
```

### useHandleConnectionData

**參數**:
- `cb?: (event: { data: string }) => void` - 處理訊息的回調函數

**注意**: 在頁面層級呼叫，避免重複監聽

## 🐛 除錯命令

```javascript
// Console 中執行

// 1. 檢查 flutterObject
console.log(typeof window.flutterObject);

// 2. 測試定位請求
window.flutterObject?.postMessage(JSON.stringify({ name: 'location', data: null }));

// 3. 監聽所有訊息
window.flutterObject?.addEventListener('message', (e) => {
  console.log('Flutter message:', JSON.parse(e.data));
});
```

## ⚡ 最佳實踐

### ✅ 推薦

```tsx
// 1. 使用 hook 取得定位（自動回退）
const { requestLocation } = useFlutterLocation();
const coords = await requestLocation();

// 2. 在頁面層級註冊監聽器
useHandleConnectionData(handleMessage); // in /pages

// 3. 檢查環境後使用功能
if (window.flutterObject) {
  // 使用 Flutter 功能
}
```

### ❌ 避免

```tsx
// 1. 直接使用 navigator.geolocation（應使用 hook）
navigator.geolocation.getCurrentPosition(...); // 不推薦

// 2. 在元件層級註冊監聽器
useHandleConnectionData(handleMessage); // in /components - 可能重複

// 3. 假設一定在 Flutter 環境
flutterObject.postMessage(...); // 可能 undefined
```

## 📁 相關檔案

- `src/hooks/useFlutterLocation.ts` - 混合式定位 hook
- `src/hooks/useHandleConnectionData.ts` - 訊息處理 hook
- `src/types/global.d.ts` - TypeScript 類型定義
- `src/components/FlutterIntegrationExample.tsx` - 完整範例

## 🔗 完整文件

詳細資訊請參考：
- [完整整合指南](./FLUTTER_INTEGRATION.md)
- [實作總結](./IMPLEMENTATION_SUMMARY.md)
- [TownPass 官方文件](https://townpass.taipei/docs/)

## 💡 提示

1. 開發時建議啟用 `debug: true` 查看詳細日誌
2. 所有請求都有超時保護，預設值已優化
3. 混合式定位會自動選擇最佳來源
4. 確保 App 端已正確實作對應的訊息處理

---

**快速測試**:

```tsx
// 在任何頁面加入此段測試
import { useFlutterLocation } from '@/hooks/useFlutterLocation';

const { requestLocation } = useFlutterLocation({ debug: true });

<button onClick={async () => {
  try {
    const coords = await requestLocation();
    alert(`${coords.latitude}, ${coords.longitude}`);
  } catch (e) {
    alert(`Error: ${e}`);
  }
}}>
  Test Location
</button>
```
