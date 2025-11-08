# Flutter WebView 本地測試指南

## 🚀 快速開始

### 1. 啟動開發伺服器

```bash
npm run dev
```

### 2. 訪問測試頁面

在瀏覽器中打開：
```
http://localhost:5173/flutter-test
```

## 📱 測試方法

### 方法一：使用內建模擬按鈕（最簡單）

1. 點擊頁面上的「模擬 Flutter 定位」按鈕
2. 系統會自動模擬 Flutter App 的定位回應
3. 查看定位結果

### 方法二：在 Console 中手動測試

打開瀏覽器開發者工具 (F12)，在 Console 中執行：

#### 2.1 創建模擬的 flutterObject

```javascript
// 複製以下整段到 Console 執行
window.flutterObject = {
  postMessage: function(msg) {
    console.log('📤 發送到 Flutter:', msg);
    const request = JSON.parse(msg);
    
    // 模擬定位回應
    if (request.name === 'location') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({
            data: JSON.stringify({
              name: 'location',
              data: {
                latitude: 25.0330,  // 台北 101
                longitude: 121.5654,
                accuracy: 10.0
              }
            })
          });
        }
      }, 500); // 模擬網路延遲
    }
    
    // 模擬使用者資訊回應
    if (request.name === 'userinfo') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({
            data: JSON.stringify({
              name: 'userinfo',
              data: {
                id: 'test-user-123',
                name: '測試使用者',
                email: 'test@example.com',
                phone: '0912345678'
              }
            })
          });
        }
      }, 500);
    }
  },
  addEventListener: function(event, handler) {
    console.log('👂 註冊監聽器:', event);
    if (event === 'message') {
      this.onmessage = handler;
    }
  },
  removeEventListener: function() {
    console.log('🔇 移除監聽器');
  },
  onmessage: null
};

console.log('✅ flutterObject 已創建！現在刷新頁面測試');
```

#### 2.2 刷新頁面

執行完上面的命令後，按 `Ctrl+R` (或 `Cmd+R`) 刷新頁面

#### 2.3 測試功能

現在點擊測試頁面上的按鈕：
- 「請求定位」- 會自動模擬 Flutter 定位回應
- 「請求使用者資訊」- 會自動模擬使用者資訊回應

### 方法三：測試 Web GPS 回退功能

1. **不**創建 `flutterObject`（或使用無痕模式）
2. 點擊「請求定位」按鈕
3. 允許瀏覽器使用位置權限
4. 系統會自動使用瀏覽器的 GPS 功能

## 🔍 觀察 Debug 日誌

在測試頁面底部的「Debug 資訊」區塊，可以看到：
- flutterObject 是否存在
- 定位狀態
- 錯誤訊息
- 收到的訊息數量

同時在瀏覽器 Console 中可以看到詳細的執行日誌：
```
[useFlutterLocation] Requesting location...
[useFlutterLocation] Flutter app detected, requesting location from app...
[useFlutterLocation] Received location from Flutter app: {...}
```

## 📋 測試清單

使用以下清單確保所有功能正常：

### ✅ 定位功能
- [ ] Flutter 環境下請求定位成功
- [ ] 顯示正確的經緯度
- [ ] 顯示精確度資訊
- [ ] 模擬按鈕正常運作

### ✅ 回退機制
- [ ] 無 Flutter 環境時使用 Web GPS
- [ ] 超時後自動回退
- [ ] 錯誤訊息清楚顯示

### ✅ 使用者資訊
- [ ] 請求使用者資訊成功
- [ ] 正確解析回應資料
- [ ] JSON 格式顯示正確

### ✅ 訊息處理
- [ ] 訊息日誌正常記錄
- [ ] 時間戳正確
- [ ] 不同類型訊息都能處理

## 🧪 進階測試

### 測試超時回退

```javascript
// 創建一個不會回應的 flutterObject
window.flutterObject = {
  postMessage: function(msg) {
    console.log('📤 收到請求但不回應:', msg);
    // 故意不回應，測試超時機制
  },
  addEventListener: function() {},
  removeEventListener: function() {}
};
```

刷新頁面後點擊「請求定位」，應該在 3 秒後自動回退到 Web GPS。

### 測試錯誤處理

```javascript
// 創建會回傳錯誤資料的 flutterObject
window.flutterObject = {
  postMessage: function(msg) {
    if (this.onmessage) {
      this.onmessage({
        data: 'invalid json data'  // 故意傳送無效的 JSON
      });
    }
  },
  addEventListener: function(event, handler) {
    this.onmessage = handler;
  },
  removeEventListener: function() {}
};
```

### 測試不同定位精確度

```javascript
// 模擬低精確度定位
window.flutterObject.onmessage({
  data: JSON.stringify({
    name: 'location',
    data: {
      latitude: 25.0330,
      longitude: 121.5654,
      accuracy: 500.0  // 低精確度
    }
  })
});

// 模擬高精確度定位
window.flutterObject.onmessage({
  data: JSON.stringify({
    name: 'location',
    data: {
      latitude: 25.0330,
      longitude: 121.5654,
      accuracy: 5.0  // 高精確度
    }
  })
});
```

## 💡 常見問題

### Q: 為什麼點擊按鈕沒有反應？

A: 
1. 檢查 Console 是否有錯誤訊息
2. 確認已正確創建 `flutterObject`
3. 確認頁面已刷新

### Q: 如何清除測試資料？

A: 重新載入頁面即可清除所有狀態

### Q: Web GPS 要求權限怎麼辦？

A: 點擊瀏覽器提示的「允許」按鈕。如果不小心拒絕了，需要在瀏覽器設定中重新允許位置權限。

### Q: 如何在其他頁面測試？

A: 可以在 `Exercise.tsx` 頁面測試實際應用場景：
```
http://localhost:5173/exercise
```

## 📊 測試結果範例

成功的測試結果應該看起來像這樣：

```
環境狀態: ✅ Flutter WebView
定位資料:
  緯度: 25.033000
  經度: 121.565400
  精確度: ±10.00m

訊息日誌:
[14:30:45] 📍 模擬 Flutter 定位回應
[14:30:44] ✅ 定位成功: 25.033000, 121.565400
[14:30:43] 收到訊息: {"name":"location","data":{...}}
```

## 🎯 下一步

測試完成後，您可以：

1. 在 `Exercise.tsx` 中查看實際應用
2. 修改 `useFlutterLocation.ts` 調整超時時間
3. 添加更多 Flutter 功能整合
4. 部署到實際的 Flutter WebView 環境測試

## 📚 相關文件

- [完整整合指南](./FLUTTER_INTEGRATION.md)
- [快速參考](./FLUTTER_QUICK_REFERENCE.md)
- [實作總結](./IMPLEMENTATION_SUMMARY.md)
