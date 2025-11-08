import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Exercise: React.FC = () => {
  const navigate = useNavigate();

  const [isExercising, setIsExercising] = useState(false);
  const isExercisingRef = useRef(false);

  const [duration, setDuration] = useState(0);
  const durationIntervalRef = useRef<number | null>(null);

  const [steps, setSteps] = useState(0);

  // useRef for last magnitude and last step time to avoid stale closure
  const lastMagRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(0);

  // handler ref so we can remove listener later
  const motionHandlerRef = useRef<(e: DeviceMotionEvent) => void | null>(null);

  // Configurable parameters
  const stepThresholdRef = useRef<number>(1.2); // adjust between ~0.8 - 2.5 based on device & movement
  const minStepInterval = 300; // ms, 防止重複計步

  // Optional debug flag
  const DEBUG = false;

  const startExercise = () => {
    setIsExercising(true);
    isExercisingRef.current = true;

    setDuration(0);
    setSteps(0);
    lastMagRef.current = 0;
    lastStepTimeRef.current = 0;

    toast.success("運動開始！保持節奏~");

    // 開始時間計時器
    if (durationIntervalRef.current) {
      window.clearInterval(durationIntervalRef.current);
    }
    durationIntervalRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    // iOS 需要 requestPermission（必須在 user gesture 才能成功）
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      (DeviceMotionEvent as any)
        .requestPermission()
        .then((permissionState: string) => {
          if (permissionState === "granted") {
            setupMotionDetection();
          } else {
            toast.error("需要動作傳感器權限才能偵測步數");
          }
        })
        .catch((err: any) => {
          console.error("requestPermission error:", err);
          toast.error("無法取得傳感器權限");
        });
    } else {
      // 非 iOS 或舊版直接啟用
      setupMotionDetection();
    }
  };

  const setupMotionDetection = () => {
    lastMagRef.current = 0;
    lastStepTimeRef.current = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!isExercisingRef.current) return;

      // 優先使用不含重力的加速度（若可用），否則退回包含重力
      const a = event.acceleration ?? event.accelerationIncludingGravity;
      if (!a) return;

      const ax = a.x ?? 0;
      const ay = a.y ?? 0;
      const az = a.z ?? 0;

      // 速度向量大小
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);

      // 第一次進來時 lastMag 可能為 0，直接設成 mag 並 return（避免一開始就計步）
      const last = lastMagRef.current || mag;
      const delta = Math.abs(mag - last);

      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.debug("acc:", { ax, ay, az, mag, delta });
      }

      lastMagRef.current = mag;

      const now = Date.now();
      if (delta > stepThresholdRef.current && now - lastStepTimeRef.current > minStepInterval) {
        setSteps((prev) => prev + 1);
        lastStepTimeRef.current = now;
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug("step detected. delta:", delta);
        }
      }
    };

    // 保存 reference 以便 later removeEventListener
    motionHandlerRef.current = handleMotion;
    // 使用 capture true 在某些瀏覽器上可改善事件接收，視情況可移除第三個參數
    window.addEventListener("devicemotion", handleMotion);
  };

  const stopExercise = () => {
    setIsExercising(false);
    isExercisingRef.current = false;

    // 清理計時器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // 移除動作監聽器
    if (motionHandlerRef.current) {
      window.removeEventListener("devicemotion", motionHandlerRef.current);
      motionHandlerRef.current = null;
    }

    // 計算獎勵
    const stamina = Math.floor(duration / 10);
    const satiety = Math.floor(steps / 20);
    const mood = Math.floor(duration / 15);

    toast.success(`運動完成！獲得：體力+${stamina} 飽食度+${satiety} 心情+${mood}`);
  };

  // 若元件 unmount，要確保清理
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (motionHandlerRef.current) {
        window.removeEventListener("devicemotion", motionHandlerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-game-bg p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center text-primary">運動模式</h1>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">{duration}秒</div>
                <div className="text-sm text-muted-foreground mt-1">運動時長</div>
              </div>

              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">{steps}</div>
                <div className="text-sm text-muted-foreground mt-1">步數</div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-foreground">運動提示</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 早上6-10點運動有 +15% 加成（早雞）</li>
                <li>• 雨天戶外運動額外獎勵（雨天不退）</li>
                <li>• 持續運動提升手雞各項數值</li>
                <li>• 搖晃手機即可自動偵測步數（請在實機上測試）</li>
              </ul>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full h-16 text-lg"
            variant={isExercising ? "destructive" : "default"}
            onClick={isExercising ? stopExercise : startExercise}
          >
            {isExercising ? (
              <>
                <Square className="w-5 h-5 mr-2" />
                結束運動
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                開始運動
              </>
            )}
          </Button>
        </Card>

        <Card className="p-4 bg-accent/10 border-accent">
          <p className="text-sm text-center text-accent-foreground">
            💡 使用手機加速度傳感器實時偵測您的運動步數！（僅支援實機、HTTPS / localhost）
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Exercise;