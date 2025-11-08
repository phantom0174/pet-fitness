import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Activity = "idle" | "walking" | "jumping" | "unknown";
type CalibLabel = "walking" | "jumping";

const LOCAL_KEY = "exercise_params_v1";

const Exercise: React.FC = () => {
  const navigate = useNavigate();

  const [isExercising, setIsExercising] = useState(false);
  const isExercisingRef = useRef(false);

  const [duration, setDuration] = useState(0);
  const durationIntervalRef = useRef<number | null>(null);

  const [steps, setSteps] = useState(0);

  // activity state
  const [activity, setActivity] = useState<Activity>("idle");

  // useRef for last magnitude and last step time to avoid stale closure
  const lastMagRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(0);

  // handler ref so we can remove listener later
  const motionHandlerRef = useRef<(e: DeviceMotionEvent) => void | null>(null);

  // Configurable parameters for basic step detection (defaults adjusted)
  const [stepThreshold, setStepThreshold] = useState<number>(1.2); // lower, since we use linear acc
  const minStepInterval = 400; // ms, 防止重複計步

  // Parameters for activity classification (UI-controllable)
  const [windowSizeMs, setWindowSizeMs] = useState<number>(2000);
  const [featureComputeIntervalMs, setFeatureComputeIntervalMs] = useState<number>(600);

  // peak detection thresholds (可在實機上調整)
  const [magPeakThreshold, setMagPeakThreshold] = useState<number>(1.0);
  const [jumpAmpThreshold, setJumpAmpThreshold] = useState<number>(7); // 略降，以便手機差異
  const [verticalPeakRatioForJump, setVerticalPeakRatioForJump] = useState<number>(0.5);
  const [cadenceWalkingMin, setCadenceWalkingMin] = useState<number>(0.8); // Hz
  const [cadenceWalkingMax, setCadenceWalkingMax] = useState<number>(2.5); // Hz

  // buffer for sliding window (store linear accel mag)
  const samplesRef = useRef<
    Array<{ t: number; lax: number; lay: number; laz: number; mag: number }>
  >([]);

  // gravity estimate for simple high-pass (low-pass for gravity)
  const gravityRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  // feature timer ref so we can clear properly
  const featureTimerRef = useRef<number | null>(null);

  // Optional debug flag
  const [DEBUG, setDEBUG] = useState<boolean>(false);

  // control panel: outdoor / rain / weather-auto (kept)
  const [isOutdoor, setIsOutdoor] = useState<boolean>(false);
  const [manualRain, setManualRain] = useState<boolean>(false);
  const [autoDetectWeather, setAutoDetectWeather] = useState<boolean>(false);
  const [isRainingDetected, setIsRainingDetected] = useState<boolean>(false);
  const [weatherChecking, setWeatherChecking] = useState<boolean>(false);

  // bonuses (percent)
  const [morningBonusPercent, setMorningBonusPercent] = useState<number>(15);
  const [rainyBonusPercent, setRainyBonusPercent] = useState<number>(10);

  // start time ref to decide morning overlap
  const startTimeRef = useRef<number | null>(null);

  // calibration states & refs
  const [calibrating, setCalibrating] = useState<boolean>(false);
  const calibratingRef = useRef<boolean>(false);
  const calibLabelRef = useRef<CalibLabel | null>(null);
  const calibBufferRef = useRef<Array<{ t: number; lax: number; lay: number; laz: number; mag: number }>>([]);
  const calibTimerRef = useRef<number | null>(null);
  const [calibCountdown, setCalibCountdown] = useState<number>(0);
  const [calibDuration, setCalibDuration] = useState<number>(8); // seconds per calibration run
  const [lastCalibResult, setLastCalibResult] = useState<any>(null);
  const [savedParams, setSavedParams] = useState<Record<string, any> | null>(null);

  // simple helper: magnitude
  const mag = (ax: number, ay: number, az: number) => Math.sqrt(ax * ax + ay * ay + az * az);

  // load saved params on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedParams(parsed);
        // apply loaded params to UI (but don't overwrite if absent)
        if (parsed?.stepThreshold) setStepThreshold(parsed.stepThreshold);
        if (parsed?.magPeakThreshold) setMagPeakThreshold(parsed.magPeakThreshold);
        if (parsed?.jumpAmpThreshold) setJumpAmpThreshold(parsed.jumpAmpThreshold);
        if (parsed?.cadenceWalkingMin) setCadenceWalkingMin(parsed.cadenceWalkingMin);
        if (parsed?.cadenceWalkingMax) setCadenceWalkingMax(parsed.cadenceWalkingMax);
      }
    } catch (err) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startExercise = () => {
    setIsExercising(true);
    isExercisingRef.current = true;

    setDuration(0);
    setSteps(0);
    lastMagRef.current = 0;
    lastStepTimeRef.current = 0;
    setActivity("idle");
    samplesRef.current = [];
    gravityRef.current = { x: 0, y: 0, z: 0 };
    startTimeRef.current = Date.now();

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

    // if auto-detect weather requested, start one fetch
    if (autoDetectWeather) {
      detectWeatherNow();
    }
  };

  const stopExercise = () => {
    setIsExercising(false);
    isExercisingRef.current = false;

    // 清理計時器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // 清理 feature timer
    if (featureTimerRef.current) {
      clearInterval(featureTimerRef.current);
      featureTimerRef.current = null;
    }

    // 清理 calibration timer if any
    if (calibTimerRef.current) {
      clearInterval(calibTimerRef.current);
      calibTimerRef.current = null;
      setCalibCountdown(0);
      calibratingRef.current = false;
      setCalibrating(false);
    }

    // 移除動作監聽器
    if (motionHandlerRef.current) {
      window.removeEventListener("devicemotion", motionHandlerRef.current);
      motionHandlerRef.current = null;
    }

    // 計算獎勵（基本）
    let stamina = Math.floor(duration / 10);
    let satiety = Math.floor(steps / 20);
    let mood = Math.floor(duration / 15);

    // 套用早雞加成（若在早上 6-10 點 start 時段）
    let totalMultiplier = 1;
    const startTs = startTimeRef.current ? new Date(startTimeRef.current) : new Date();
    const startHour = startTs.getHours();
    // 判定若 start 時間落在 6:00-9:59 視為早雞
    if (startHour >= 6 && startHour < 10) {
      totalMultiplier *= 1 + morningBonusPercent / 100;
    }

    // 判定雨天戶外獎勵（需戶外且發現下雨 or 手動勾選下雨）
    const raining = manualRain || isRainingDetected;
    if (isOutdoor && raining) {
      totalMultiplier *= 1 + rainyBonusPercent / 100;
    }

    // apply multiplier and compute final increments (取整數)
    const finalStamina = Math.floor(stamina * totalMultiplier);
    const finalSatiety = Math.floor(satiety * totalMultiplier);
    const finalMood = Math.floor(mood * totalMultiplier);

    toast.success(
      `運動完成！偵測到活動: ${activity}。獲得：體力+${finalStamina} 飽食度+${finalSatiety} 心情+${finalMood}`
    );
  };

  // count peaks naive: a sample is a peak when v > neighbors and > threshold, and respect min interval
  const countPeaks = (
    seq: Array<{ t: number; v: number }>,
    threshold: number,
    minIntervalMs = 250
  ) => {
    let count = 0;
    let lastPeakT = -Infinity;
    for (let i = 1; i < seq.length - 1; i++) {
      const prev = seq[i - 1].v;
      const cur = seq[i].v;
      const next = seq[i + 1].v;
      // require cur be local maximum and above threshold
      if (cur > prev && cur > next && cur > threshold && seq[i].t - lastPeakT > minIntervalMs) {
        count++;
        lastPeakT = seq[i].t;
      }
    }
    return count;
  };

  // compute features on sliding window and classify
  const computeFeaturesAndClassify = () => {
    const now = Date.now();
    const windowSize = windowSizeMs;
    const cutoff = now - windowSize;
    const buf = samplesRef.current.filter((s) => s.t >= cutoff);
    samplesRef.current = buf; // save trimmed buffer

    if (buf.length < 4) {
      setActivity("idle");
      return;
    }

    // statistics
    const mags = buf.map((s) => s.mag);
    const meanMag = mags.reduce((a, b) => a + b, 0) / mags.length;
    const variance =
      mags.reduce((a, b) => a + (b - meanMag) * (b - meanMag), 0) / Math.max(1, mags.length - 1);
    const stdMag = Math.sqrt(variance);
    const maxMag = Math.max(...mags);

    // peak detection in magnitude and vertical component (laz)
    const peakThreshold = magPeakThreshold;
    const peaksMag = countPeaks(buf.map((s) => ({ t: s.t, v: s.mag })), peakThreshold, 250);
    const peaksZ = countPeaks(buf.map((s) => ({ t: s.t, v: Math.abs(s.laz) })), peakThreshold, 250);

    // estimate cadence (Hz) = peaks per second
    const windowSec = Math.max(0.001, (buf[buf.length - 1].t - buf[0].t) / 1000);
    const cadenceHz = peaksMag / windowSec;

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug({
        meanMag,
        stdMag,
        maxMag,
        peaksMag,
        peaksZ,
        windowSec,
        cadenceHz,
      });
    }

    // Simple rule-based classification (adjusted heuristics)
    const isLikelyJump =
      maxMag > jumpAmpThreshold && peaksMag >= 2 && peaksZ / Math.max(1, peaksMag) >= verticalPeakRatioForJump;

    const isLikelyWalk =
      cadenceHz >= cadenceWalkingMin &&
      cadenceHz <= cadenceWalkingMax &&
      stdMag < 6.0 && // allow slightly larger std for different placements
      peaksMag >= 1;

    if (isLikelyJump) {
      setActivity("jumping");
    } else if (isLikelyWalk) {
      setActivity("walking");
    } else if (maxMag < 0.9 && stdMag < 0.6) {
      setActivity("idle");
    } else {
      setActivity("unknown");
    }
  };

  // setup motion listener and periodic feature compute
  const setupMotionDetection = () => {
    lastMagRef.current = 0;
    lastStepTimeRef.current = 0;
    samplesRef.current = [];
    gravityRef.current = { x: 0, y: 0, z: 0 };

    const alpha = 0.85; // low-pass alpha for gravity estimation (higher => slower change)

    const handleMotion = (event: DeviceMotionEvent) => {
      // we accept motion if either exercising OR calibrating (calibration requires startExercise in this UI)
      if (!isExercisingRef.current && !calibratingRef.current) return;

      // 優先使用不含重力的加速度（若可用），否則退回包含重力並做 gravity 抽離
      const a = event.acceleration ?? event.accelerationIncludingGravity;
      if (!a) return;

      const ax = a.x ?? 0;
      const ay = a.y ?? 0;
      const az = a.z ?? 0;

      // update gravity estimate (low-pass)
      gravityRef.current.x = alpha * gravityRef.current.x + (1 - alpha) * ax;
      gravityRef.current.y = alpha * gravityRef.current.y + (1 - alpha) * ay;
      gravityRef.current.z = alpha * gravityRef.current.z + (1 - alpha) * az;

      // linear acceleration = raw - gravity
      const lax = ax - gravityRef.current.x;
      const lay = ay - gravityRef.current.y;
      const laz = az - gravityRef.current.z;

      // magnitude on linear acceleration
      const linearMag = mag(lax, lay, laz);
      const now = Date.now();

      // add to buffer for normal feature/computation
      samplesRef.current.push({ t: now, lax, lay, laz, mag: linearMag });

      // if calibrating, also store into calibration buffer
      if (calibratingRef.current) {
        calibBufferRef.current.push({ t: now, lax, lay, laz, mag: linearMag });
      }

      // naive step detection on linear magnitude
      const last = lastMagRef.current || linearMag;
      const delta = Math.abs(linearMag - last);
      lastMagRef.current = linearMag;

      if (delta > stepThreshold && now - lastStepTimeRef.current > minStepInterval) {
        setSteps((prev) => prev + 1);
        lastStepTimeRef.current = now;
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug("step detected. delta:", delta, "linearMag:", linearMag);
        }
      }

      // start periodic feature computation timer if not exist
      if (!featureTimerRef.current) {
        featureTimerRef.current = window.setInterval(() => {
          computeFeaturesAndClassify();
        }, featureComputeIntervalMs) as unknown as number;
      }
    };

    motionHandlerRef.current = handleMotion;
    window.addEventListener("devicemotion", handleMotion);
  };

  // calibration flow: requires user to first press 開始運動 (so permissions are granted & listener active)
  const startCalibration = (label: CalibLabel) => {
    if (!isExercisingRef.current) {
      toast.error("請先按「開始運動」再進行校準（能確保取得感測器資料）");
      return;
    }
    if (calibratingRef.current) {
      toast.error("正在校準中");
      return;
    }

    calibBufferRef.current = [];
    calibLabelRef.current = label;
    setCalibCountdown(calibDuration);
    setCalibrating(true);
    calibratingRef.current = true;

    // countdown timer
    calibTimerRef.current = window.setInterval(() => {
      setCalibCountdown((prev) => {
        if (prev <= 1) {
          // stop
          if (calibTimerRef.current) {
            clearInterval(calibTimerRef.current);
            calibTimerRef.current = null;
          }
          setCalibrating(false);
          calibratingRef.current = false;
          finalizeCalibration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;

    toast.success(`開始校準：請進行 ${label === "walking" ? "走路" : "開合跳"}（${calibDuration} 秒）`);
  };

  const finalizeCalibration = () => {
    const buf = calibBufferRef.current.slice();
    if (!buf.length) {
      toast.error("校準失敗：沒有收集到資料");
      return;
    }

    // compute features
    const mags = buf.map((s) => s.mag);
    const meanMag = mags.reduce((a, b) => a + b, 0) / mags.length;
    const variance = mags.reduce((a, b) => a + (b - meanMag) * (b - meanMag), 0) / Math.max(1, mags.length - 1);
    const stdMag = Math.sqrt(variance);
    const maxMag = Math.max(...mags);

    const peaksMag = countPeaks(buf.map((s) => ({ t: s.t, v: s.mag })), Math.max(0.3, meanMag + stdMag * 0.2), 200);
    const peaksZ = countPeaks(buf.map((s) => ({ t: s.t, v: Math.abs(s.laz) })), Math.max(0.3, meanMag + stdMag * 0.2), 200);

    const windowSec = Math.max(0.001, (buf[buf.length - 1].t - buf[0].t) / 1000);
    const cadenceHz = peaksMag / windowSec;

    const label = calibLabelRef.current;

    // derive recommended params
    const recommended: any = {
      label,
      meanMag,
      stdMag,
      maxMag,
      peaksMag,
      peaksZ,
      cadenceHz,
    };

    // suggested thresholds heuristics:
    if (label === "walking") {
      // walking: step threshold small, cadence range around measured cadence
      recommended.stepThreshold = Math.max(0.4, meanMag + stdMag * 0.25);
      recommended.magPeakThreshold = Math.max(0.5, meanMag + stdMag * 0.45);
      recommended.cadenceWalkingMin = Math.max(0.4, cadenceHz - 0.6);
      recommended.cadenceWalkingMax = Math.min(4, cadenceHz + 0.6);
      // jumping threshold keep unchanged here
    } else if (label === "jumping") {
      // jumping: strong peaks; set jump amp threshold based on observed max
      recommended.jumpAmpThreshold = Math.max(5, maxMag * 0.75);
      recommended.magPeakThreshold = Math.max(0.8, meanMag + stdMag * 0.6);
    }

    setLastCalibResult(recommended);
    toast.success("校準完成，已產生建議值");
  };

  const applyRecommended = () => {
    if (!lastCalibResult) {
      toast.error("沒有校準結果可以套用");
      return;
    }
    const r = lastCalibResult;
    if (r.stepThreshold) setStepThreshold(roundNum(r.stepThreshold));
    if (r.magPeakThreshold) setMagPeakThreshold(roundNum(r.magPeakThreshold));
    if (r.jumpAmpThreshold) setJumpAmpThreshold(Math.round(r.jumpAmpThreshold));
    if (r.cadenceWalkingMin) setCadenceWalkingMin(roundNum(r.cadenceWalkingMin));
    if (r.cadenceWalkingMax) setCadenceWalkingMax(roundNum(r.cadenceWalkingMax));
    toast.success("已套用建議參數");
  };

  const saveParams = () => {
    const payload = {
      stepThreshold,
      magPeakThreshold,
      jumpAmpThreshold,
      cadenceWalkingMin,
      cadenceWalkingMax,
      verticalPeakRatioForJump,
      windowSizeMs,
      featureComputeIntervalMs,
      morningBonusPercent,
      rainyBonusPercent,
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
    setSavedParams(payload);
    toast.success("參數已儲存到 localStorage");
  };

  const loadParams = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) {
        toast.error("找不到已儲存的參數");
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed.stepThreshold) setStepThreshold(parsed.stepThreshold);
      if (parsed.magPeakThreshold) setMagPeakThreshold(parsed.magPeakThreshold);
      if (parsed.jumpAmpThreshold) setJumpAmpThreshold(parsed.jumpAmpThreshold);
      if (parsed.cadenceWalkingMin) setCadenceWalkingMin(parsed.cadenceWalkingMin);
      if (parsed.cadenceWalkingMax) setCadenceWalkingMax(parsed.cadenceWalkingMax);
      setSavedParams(parsed);
      toast.success("已載入儲存參數");
    } catch (err) {
      toast.error("載入參數失敗");
    }
  };

  const roundNum = (v: number) => Math.round(v * 100) / 100;

  // Weather detection using open-meteo (no API key). Attempts geolocation and checks hourly precipitation.
  const detectWeatherNow = () => {
    if (!navigator.geolocation) {
      toast.error("瀏覽器不支援定位，無法自動偵測天氣");
      return;
    }
    setWeatherChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          // request hourly precipitation and timezone=auto so times match local
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&current_weather=true&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("Weather API error");
          const data = await res.json();
          // find nearest hourly index for now
          const times: string[] = data.hourly?.time ?? [];
          const prec: number[] = data.hourly?.precipitation ?? [];
          if (!times.length || !prec || !prec.length) {
            setIsRainingDetected(false);
            setWeatherChecking(false);
            toast.error("無法取得天氣資料");
            return;
          }
          // find index closest to current local time (hour aligned)
          const now = new Date();
          const nearestIndex = times.reduce((bestIdx: number, t, i) => {
            const dt = Math.abs(new Date(t).getTime() - now.getTime());
            return dt < Math.abs(new Date(times[bestIdx]).getTime() - now.getTime()) ? i : bestIdx;
          }, 0);
          const precipitationNow = prec[nearestIndex] ?? 0;
          // consider raining if precipitation >= 0.5 mm/h (可自訂)
          const raining = precipitationNow >= 0.5;
          setIsRainingDetected(raining);
          setWeatherChecking(false);
          toast.success(`天氣偵測完成：${raining ? "偵測到降雨" : "無降雨"}`);
        } catch (err) {
          console.error(err);
          setIsRainingDetected(false);
          setWeatherChecking(false);
          toast.error("取得天氣資訊失敗");
        }
      },
      (err) => {
        console.error(err);
        setWeatherChecking(false);
        toast.error("無法取得定位（請允許定位）");
      },
      { timeout: 10000 }
    );
  };

  // 若元件 unmount，要確保清理
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (featureTimerRef.current) {
        clearInterval(featureTimerRef.current);
      }
      if (calibTimerRef.current) {
        clearInterval(calibTimerRef.current);
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
                <li>• 持續運動提升手雞各項數值</li>
                <li>• 搖晃手機即可自動偵測步數</li>
                <li>• 校準模式可以收集走路 / 開合跳樣本並建議參數</li>
              </ul>
            </div>

            <div className="text-center">
              <div className="inline-block px-3 py-1 rounded bg-muted text-sm">
                偵測到活動：{" "}
                <span className="font-semibold">
                  {activity === "idle"
                    ? "靜止"
                    : activity === "walking"
                      ? "走路"
                      : activity === "jumping"
                        ? "開合跳"
                        : "未知"}
                </span>
              </div>
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

        {/* 控制面板 */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground">偵測 & 加成 控制面板</h3>

          <div className="grid gap-2">
            <label className="text-sm">步伐閾值 (delta)：{stepThreshold.toFixed(2)}</label>
            <input
              type="range"
              min={0.3}
              max={3}
              step={0.1}
              value={stepThreshold}
              onChange={(e) => setStepThreshold(parseFloat(e.target.value))}
            />

            <label className="text-sm">mag 峰值閾值：{magPeakThreshold.toFixed(2)}</label>
            <input
              type="range"
              min={0.3}
              max={3}
              step={0.1}
              value={magPeakThreshold}
              onChange={(e) => setMagPeakThreshold(parseFloat(e.target.value))}
            />

            <label className="text-sm">跳躍振幅閾值 (max mag)：{jumpAmpThreshold}</label>
            <input
              type="range"
              min={4}
              max={30}
              step={0.5}
              value={jumpAmpThreshold}
              onChange={(e) => setJumpAmpThreshold(parseFloat(e.target.value))}
            />

            <label className="text-sm">視窗大小 (ms)：{windowSizeMs} ms</label>
            <input
              type="range"
              min={800}
              max={5000}
              step={100}
              value={windowSizeMs}
              onChange={(e) => setWindowSizeMs(parseInt(e.target.value, 10))}
            />

            <label className="text-sm">特徵計算間隔 (ms)：{featureComputeIntervalMs} ms</label>
            <input
              type="range"
              min={300}
              max={2000}
              step={100}
              value={featureComputeIntervalMs}
              onChange={(e) => setFeatureComputeIntervalMs(parseInt(e.target.value, 10))}
            />

            <div className="flex items-center justify-between">
              <label className="text-sm">顯示偵錯 (DEBUG)</label>
              <input type="checkbox" checked={DEBUG} onChange={(e) => setDEBUG(e.target.checked)} />
            </div>

            <hr />

            <h4 className="font-medium">校準模式 (請先按「開始運動」以取得感測器權限)</h4>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => startCalibration("walking")}
                disabled={calibrating || !isExercising}
                className="px-3 py-1"
              >
                開始校準：走路 ({calibDuration}s)
              </Button>
              <Button
                size="sm"
                onClick={() => startCalibration("jumping")}
                disabled={calibrating || !isExercising}
                className="px-3 py-1"
              >
                開始校準：開合跳 ({calibDuration}s)
              </Button>
              <div className="text-sm">
                {calibrating ? `校準中 ${calibCountdown}s` : "準備中"}
              </div>
            </div>

            {lastCalibResult && (
              <div className="p-2 bg-muted rounded">
                <div className="text-sm font-medium">最近一次校準結果（{lastCalibResult.label}）</div>
                <div className="text-xs text-muted-foreground">
                  mean mag: {roundNum(lastCalibResult.meanMag)}, std: {roundNum(lastCalibResult.stdMag)}, max:{" "}
                  {roundNum(lastCalibResult.maxMag)}, peaks: {lastCalibResult.peaksMag}, cadence:{" "}
                  {roundNum(lastCalibResult.cadenceHz)} Hz
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={applyRecommended}>
                    套用建議參數
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const copy = { ...lastCalibResult };
                      localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...savedParams, lastCalibResult: copy }));
                      toast.success("校準結果暫存於 localStorage");
                    }}
                  >
                    儲存此校準結果
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-2 flex gap-2 items-center">
              <Button size="sm" onClick={saveParams}>
                儲存目前參數
              </Button>
              <Button size="sm" onClick={loadParams}>
                載入儲存參數
              </Button>
              <div className="text-sm">
                {savedParams ? "已載入參數" : "尚未有儲存參數"}
              </div>
            </div>

            <hr />

            <h4 className="font-medium">加成設定</h4>

            <label className="text-sm">早雞加成 (%)：{morningBonusPercent}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={morningBonusPercent}
              onChange={(e) => setMorningBonusPercent(parseInt(e.target.value, 10))}
            />

            <label className="text-sm">雨天戶外加成 (%)：{rainyBonusPercent}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={rainyBonusPercent}
              onChange={(e) => setRainyBonusPercent(parseInt(e.target.value, 10))}
            />

            <div className="flex items-center justify-between">
              <label className="text-sm">是否為戶外運動</label>
              <input type="checkbox" checked={isOutdoor} onChange={(e) => setIsOutdoor(e.target.checked)} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">手動標示「下雨」</label>
              <input type="checkbox" checked={manualRain} onChange={(e) => setManualRain(e.target.checked)} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">自動偵測天氣（需允許定位）</label>
              <input
                type="checkbox"
                checked={autoDetectWeather}
                onChange={(e) => setAutoDetectWeather(e.target.checked)}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded bg-primary text-white"
                onClick={detectWeatherNow}
                disabled={weatherChecking}
              >
                {weatherChecking ? "偵測中..." : "立即偵測天氣"}
              </button>
              <div className="text-sm">
                偵測結果：{manualRain ? "手動：下雨" : isRainingDetected ? "自動：下雨" : "無降雨"}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-accent/10 border-accent">
          <p className="text-sm text-center text-accent-foreground">
            💡 使用手機加速度傳感器實時偵測您的運動步數與活動類型！（僅支援實機、HTTPS / localhost）
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Exercise;