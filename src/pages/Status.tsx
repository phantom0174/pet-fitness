import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, Activity } from "lucide-react";

const mockHistory = [
  { date: "2025-01-07", exercise: 25, strength: 150, mood: 85 },
  { date: "2025-01-06", exercise: 15, strength: 90, mood: 70 },
  { date: "2025-01-05", exercise: 30, strength: 180, mood: 90 },
  { date: "2025-01-04", exercise: 20, strength: 120, mood: 75 },
  { date: "2025-01-03", exercise: 0, strength: 0, mood: 50 },
];

const Status = () => {
  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--tp-primary-50)' }}>
      <div className="max-w-md mx-auto space-y-4">
        <div className="tp-h2-semibold" style={{ color: 'var(--tp-primary-700)' }}>
          運動狀態
        </div>

        {/* Today's Summary */}
        <Card className="p-6" style={{ backgroundColor: 'var(--tp-white)', borderColor: 'var(--tp-primary-200)' }}>
          <div className="tp-h3-semibold mb-4" style={{ color: 'var(--tp-grayscale-800)' }}>
            今日統計
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>運動時長</div>
              <div className="tp-h2-semibold" style={{ color: 'var(--tp-primary-600)' }}>25分</div>
            </div>
            <div className="text-center">
              <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>力量增長</div>
              <div className="tp-h2-semibold" style={{ color: 'var(--tp-secondary-600)' }}>+150</div>
            </div>
            <div className="text-center">
              <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>心情值</div>
              <div className="tp-h2-semibold" style={{ color: 'var(--tp-orange-600)' }}>85</div>
            </div>
          </div>
        </Card>

        {/* Weekly Goal */}
        <Card className="p-6" style={{ backgroundColor: 'var(--tp-white)', borderColor: 'var(--tp-primary-200)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--tp-primary-600)' }} />
            <div className="tp-h3-semibold" style={{ color: 'var(--tp-grayscale-800)' }}>
              本週目標
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between tp-body-regular">
              <span style={{ color: 'var(--tp-grayscale-600)' }}>運動 100 分鐘</span>
              <span style={{ color: 'var(--tp-primary-600)' }}>90/100</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tp-grayscale-200)' }}>
              <div 
                className="h-full transition-all" 
                style={{ 
                  width: '90%',
                  backgroundColor: 'var(--tp-primary-500)'
                }}
              />
            </div>
          </div>
        </Card>

        {/* History */}
        <Card className="p-6" style={{ backgroundColor: 'var(--tp-white)', borderColor: 'var(--tp-primary-200)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" style={{ color: 'var(--tp-primary-600)' }} />
            <div className="tp-h3-semibold" style={{ color: 'var(--tp-grayscale-800)' }}>
              歷史記錄
            </div>
          </div>
          <div className="space-y-3">
            {mockHistory.map((record, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--tp-primary-50)' }}
              >
                <div>
                  <div className="tp-body-semibold" style={{ color: 'var(--tp-grayscale-800)' }}>
                    {record.date}
                  </div>
                  <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>
                    運動 {record.exercise} 分鐘
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>力量</div>
                    <div className="tp-body-semibold" style={{ color: 'var(--tp-secondary-600)' }}>
                      +{record.strength}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>心情</div>
                    <div className="tp-body-semibold" style={{ color: 'var(--tp-orange-600)' }}>
                      {record.mood}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Status;
