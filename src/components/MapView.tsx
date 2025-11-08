import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QuestLocation, UserLocation } from '@/types/quest';
import { Navigation, MapPin, Trophy, CheckCircle2 } from 'lucide-react';
import TPButton from './TPButton/TPButton';
import { Card } from './ui/card';

// 修復 Leaflet 預設圖標問題
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 自定義用戶位置圖標
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" fill-opacity="0.3"/>
      <circle cx="12" cy="12" r="3" fill="#3b82f6"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// 任務地點圖標
const createQuestIcon = (status: QuestLocation['status'], category: string) => {
  const color = status === 'completed' ? '#22c55e' : 
                status === 'in-progress' ? '#f59e0b' : 
                category === '運動場館' ? '#ec4899' : '#8b5cf6';
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3" fill="white" stroke="${color}"/>
      </svg>
    `),
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// 飛到指定位置的組件
function FlyToLocation({ target, onComplete }: { target: [number, number] | null; onComplete: () => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (target) {
      map.flyTo(target, 15, { duration: 1.5 });
      // 動畫完成後清除目標
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [target, map, onComplete]);
  
  return null;
}

// 回到我的位置按鈕組件
function LocationButton({ userLocation, hasRealLocation }: { userLocation: UserLocation; hasRealLocation: boolean }) {
  const map = useMap();
  
  const handleClick = () => {
    if (hasRealLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.5 });
    }
  };
  
  return (
    <div 
      className="leaflet-top leaflet-right" 
      style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <button
          onClick={handleClick}
          disabled={!hasRealLocation}
          className="rounded-lg shadow-lg p-3 transition-all hover:shadow-xl disabled:opacity-50"
          style={{
            backgroundColor: 'var(--tp-white)',
            border: '2px solid var(--tp-primary-500)',
            cursor: hasRealLocation ? 'pointer' : 'not-allowed'
          }}
          title="回到我的位置"
        >
          <Navigation 
            className="w-5 h-5" 
            style={{ color: hasRealLocation ? 'var(--tp-primary-600)' : 'var(--tp-grayscale-400)' }}
          />
        </button>
      </div>
    </div>
  );
}

interface MapViewProps {
  quests: QuestLocation[];
  onAcceptQuest: (quest: QuestLocation) => void;
  onCompleteQuest: (quest: QuestLocation) => void;
  devMode: boolean;
  flyToQuest?: QuestLocation | null;
  onFlyComplete?: () => void;
}

export const MapView = ({ quests, onAcceptQuest, onCompleteQuest, devMode, flyToQuest, onFlyComplete }: MapViewProps) => {
  // 預設使用台北市中心，不等待 GPS
  const [userLocation, setUserLocation] = useState<UserLocation>({ lat: 25.0330, lng: 121.5654 });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<QuestLocation | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasRealLocation, setHasRealLocation] = useState(false);
  const [showLocationButton, setShowLocationButton] = useState(false);

  // 獲取用戶位置（背景執行，不阻塞地圖顯示）
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('您的瀏覽器不支援地理定位，顯示台北市中心');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setHasRealLocation(true);
        setLocationError(null);
      },
      (error) => {
        console.error('定位錯誤:', error);
        setLocationError('無法取得您的位置，顯示台北市中心');
      },
      {
        enableHighAccuracy: false, // 改為 false 以加快首次定位
        timeout: 5000, // 縮短超時時間
        maximumAge: 30000, // 允許使用 30 秒內的快取位置
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 計算兩點之間的距離（米）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球半徑（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // 檢查用戶是否在任務範圍內
  const isInRange = (quest: QuestLocation): boolean => {
    if (devMode) return true; // 開發者模式下永遠在範圍內
    if (!userLocation) return false;
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      quest.lat,
      quest.lng
    );
    return distance <= (quest.requiredDistance || 100); // 預設100米內
  };

  const getBonusText = (bonus: { strength?: number; mood?: number }) => {
    const parts = [];
    if (bonus.strength) parts.push(`力量 +${bonus.strength}`);
    if (bonus.mood) parts.push(`心情 +${bonus.mood}`);
    return parts.join(', ');
  };

  return (
    <div className="space-y-4">
      {locationError && (
        <Card className="p-3" style={{ backgroundColor: 'var(--tp-warning-50)', borderColor: 'var(--tp-warning-300)' }}>
          <p className="tp-caption" style={{ color: 'var(--tp-warning-700)' }}>
            ⚠️ {locationError}
          </p>
        </Card>
      )}
      
      {!hasRealLocation && !locationError && (
        <Card className="p-3" style={{ backgroundColor: 'var(--tp-info-50)', borderColor: 'var(--tp-info-300)' }}>
          <p className="tp-caption" style={{ color: 'var(--tp-info-700)' }}>
            📍 正在取得您的精確位置...
          </p>
        </Card>
      )}

      <div className="rounded-lg overflow-hidden shadow-lg relative" style={{ height: '500px' }}>
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-50" 
               style={{ backgroundColor: 'var(--tp-grayscale-100)' }}>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin" 
                   style={{ borderColor: 'var(--tp-primary-500)', borderTopColor: 'transparent' }}>
              </div>
              <p className="tp-body-semibold" style={{ color: 'var(--tp-grayscale-700)' }}>
                地圖載入中...
              </p>
            </div>
          </div>
        )}
        <MapContainer
          center={[25.0330, 121.5654]} // 固定台北市中心
          zoom={12} // 適合台北市區的縮放等級
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          whenReady={() => setMapLoaded(true)}
          maxBounds={[
            [24.9, 121.3], // 西南角
            [25.3, 121.8]  // 東北角
          ]} // 限制地圖範圍在台北市周邊
          minZoom={11} // 最小縮放等級
          maxZoom={18} // 最大縮放等級
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              load: () => setMapLoaded(true)
            }}
          />
          
          {/* 飛到指定地點 */}
          <FlyToLocation 
            target={flyToQuest ? [flyToQuest.lat, flyToQuest.lng] : null} 
            onComplete={() => onFlyComplete?.()} 
          />
          
          {/* 回到我的位置按鈕 */}
          <LocationButton userLocation={userLocation} hasRealLocation={hasRealLocation} />

          {/* 用戶位置標記 - 只在有真實位置時顯示 */}
          {hasRealLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="tp-body-semibold mb-1" style={{ color: 'var(--tp-primary-700)' }}>
                      您的位置
                    </p>
                    {userLocation.accuracy && (
                      <p className="tp-caption" style={{ color: 'var(--tp-grayscale-600)' }}>
                        精確度: ±{Math.round(userLocation.accuracy)}m
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* 用戶位置精確度圓圈 */}
              {userLocation.accuracy && (
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                  }}
                />
              )}
            </>
          )}



          {/* 任務地點標記 */}
          {quests.map((quest) => {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              quest.lat,
              quest.lng
            );
            const inRange = isInRange(quest); // 使用 isInRange 函數，會考慮開發者模式

            return (
              <Marker
                key={`${quest.id}-${devMode}`} // 加入 devMode 到 key 中，確保在切換模式時重新渲染
                position={[quest.lat, quest.lng]}
                icon={createQuestIcon(quest.status, quest.category)}
                eventHandlers={{
                  click: () => setSelectedQuest({ ...quest, distance }),
                }}
              >
                <Popup maxWidth={300} key={`popup-${quest.id}-${devMode}`}>
                  <div className="space-y-2 p-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: 'var(--tp-primary-500)' }} />
                      <span className="tp-body-semibold" style={{ color: 'var(--tp-grayscale-800)' }}>
                        {quest.name}
                      </span>
                    </div>
                    
                    <span 
                      className="inline-block px-2 py-1 rounded tp-caption"
                      style={{ 
                        backgroundColor: quest.category === '運動場館' 
                          ? 'var(--tp-secondary-100)' 
                          : 'var(--tp-primary-100)',
                        color: quest.category === '運動場館'
                          ? 'var(--tp-secondary-700)'
                          : 'var(--tp-primary-700)'
                      }}
                    >
                      {quest.category}
                    </span>

                    <p className="tp-body-regular" style={{ color: 'var(--tp-grayscale-600)' }}>
                      {quest.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" style={{ color: 'var(--tp-secondary-500)' }} />
                      <span className="tp-caption" style={{ color: 'var(--tp-secondary-700)' }}>
                        {getBonusText(quest.bonus)}
                      </span>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="tp-caption mb-2" style={{ 
                        color: inRange ? 'var(--tp-success-600)' : 'var(--tp-grayscale-600)' 
                      }}>
                        距離: {Math.round(distance)}m {inRange && '✓ 在範圍內'}
                      </p>
                      
                      {quest.status === 'available' && (
                        <TPButton
                          variant="primary"
                          className="w-full"
                          disabled={!inRange}
                          onClick={() => onAcceptQuest(quest)}
                        >
                          接受任務
                        </TPButton>
                      )}
                      
                      {quest.status === 'in-progress' && (
                        <TPButton
                          variant="secondary"
                          className="w-full"
                          disabled={!inRange}
                          onClick={() => onCompleteQuest(quest)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          完成打卡
                        </TPButton>
                      )}
                      
                      {quest.status === 'completed' && (
                        <div 
                          className="text-center py-2 rounded"
                          style={{ 
                            backgroundColor: 'var(--tp-success-100)',
                            color: 'var(--tp-success-700)'
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 inline mr-1" />
                          已完成
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>

                {/* 任務範圍圓圈 */}
                <Circle
                  center={[quest.lat, quest.lng]}
                  radius={quest.requiredDistance || 100}
                  pathOptions={{
                    color: quest.status === 'completed' ? '#22c55e' : 
                           quest.status === 'in-progress' ? '#f59e0b' : '#8b5cf6',
                    fillColor: quest.status === 'completed' ? '#22c55e' : 
                               quest.status === 'in-progress' ? '#f59e0b' : '#8b5cf6',
                    fillOpacity: 0.1,
                    dashArray: '5, 10',
                  }}
                />
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* 圖例 */}
      <Card className="p-4" style={{ backgroundColor: 'var(--tp-white)' }}>
        <div className="tp-body-semibold mb-2" style={{ color: 'var(--tp-grayscale-800)' }}>
          地圖圖例
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="tp-caption">您的位置</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="tp-caption">可接任務</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
            <span className="tp-caption">進行中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="tp-caption">已完成</span>
          </div>
        </div>
      </Card>

      {/* 任務提示 */}
      <Card className="p-4" style={{ backgroundColor: 'var(--tp-secondary-50)', borderColor: 'var(--tp-secondary-300)' }}>
        <p className="tp-body-regular" style={{ color: 'var(--tp-secondary-800)' }}>
          💡 點擊地圖上的標記查看任務詳情。需要在任務範圍內（預設100米）才能接受或完成任務！
        </p>
      </Card>
    </div>
  );
};

export default MapView;
