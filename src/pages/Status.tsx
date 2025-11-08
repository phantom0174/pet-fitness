import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { getUser } from "@/lib/api";
import { useEffect, useState } from "react";
import DailyQuests from "@/components/DailyQuests";

// Format seconds into H:MM:SS or M:SS
function formatDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${two(m)}:${two(s)}`;
  return `${m}:${two(s)}`;
}

const Status = () => {
  const navigate = useNavigate();
  const { userId, pet, refreshPet } = useUser();

  if (!pet) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--tp-primary-50)' }}>
        <div className="max-w-md mx-auto">
          <div className="tp-h2-semibold" style={{ color: 'var(--tp-primary-700)' }}>
            載入中...
          </div>
        </div>
      </div>
    );
  }

  const currentLevelStrength = pet.strength % 120;
  // 直接從 pet 取得今日運動數據
  const todaySteps = pet.daily_steps || 0;
  const todayExerciseSeconds = pet.daily_exercise_seconds || 0;

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--tp-primary-50)' }}>
      <div className="max-w-md mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-2 p-0"
          style={{ color: 'var(--tp-primary-700)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <div className="tp-h2-semibold" style={{ color: 'var(--tp-primary-700)' }}>
          運動狀態
        </div>

        {/* Today's Summary */}
        <Card className="p-6" style={{ backgroundColor: 'var(--tp-white)', borderColor: 'var(--tp-primary-200)' }}>
          <div className="tp-h3-semibold mb-4" style={{ color: 'var(--tp-grayscale-800)' }}>
            目前狀態
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>等級</div>
              <div className="tp-h2-semibold" style={{ color: 'var(--tp-primary-600)' }}>{pet.level}</div>
            </div>
            <div className="text-center">
              <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>力量值</div>
              <div className="tp-h2-semibold" style={{ color: 'var(--tp-secondary-600)' }}>{currentLevelStrength}/120</div>
            </div>
            <div className="text-center">
              <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>心情值</div>
              <div className="tp-h2-semibold" style={{ color: 'var(--tp-orange-600)' }}>{pet.mood}</div>
            </div>
          </div>
        </Card>

        {/* Stamina Status */}
        <Card className="p-6" style={{ backgroundColor: 'var(--tp-white)', borderColor: 'var(--tp-primary-200)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--tp-primary-600)' }} />
            <div className="tp-h3-semibold" style={{ color: 'var(--tp-grayscale-800)' }}>
              今日體力
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between tp-body-regular">
              <span style={{ color: 'var(--tp-grayscale-600)' }}>剩餘體力</span>
              <span style={{ color: 'var(--tp-primary-600)' }}>{pet.stamina}/900</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tp-grayscale-200)' }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${(pet.stamina / 900) * 100}%`,
                  backgroundColor: pet.stamina > 300 ? 'var(--tp-primary-500)' : 'var(--tp-orange-500)'
                }}
              />
            </div>
            <div className="tp-caption" style={{ color: 'var(--tp-grayscale-500)' }}>
              {pet.stamina > 0 ? '還可以運動！' : '今天已經運動足夠了，好好休息吧！'}
            </div>
            {/* Today's steps and total exercise time */}
            <div className="mt-4 border-t pt-3 space-y-1">
              <div className="flex justify-between tp-body-regular">
                <span style={{ color: 'var(--tp-grayscale-600)' }}>今日總步數</span>
                <span style={{ color: 'var(--tp-primary-600)' }}>{todaySteps !== null ? todaySteps : '—'}</span>
              </div>
              <div className="flex justify-between tp-body-regular">
                <span style={{ color: 'var(--tp-grayscale-600)' }}>今日總運動時間</span>
                <span style={{ color: 'var(--tp-primary-600)' }}>
                  {todayExerciseSeconds !== null ? formatDuration(todayExerciseSeconds) : '—'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Quests */}
        <DailyQuests userId={userId} onQuestCompleted={refreshPet} />
      </div>
    </div>
  );
};

export default Status;
