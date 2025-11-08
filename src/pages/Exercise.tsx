import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Exercise = () => {
  const navigate = useNavigate();
  const [isExercising, setIsExercising] = useState(false);
  const [duration, setDuration] = useState(0);
  const [steps, setSteps] = useState(0);

  const startExercise = () => {
    setIsExercising(true);
    setDuration(0);
    setSteps(0);
    toast.success("運動開始！保持節奏~");
    
    // Simulate exercise tracking
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
      setSteps((prev) => prev + Math.floor(Math.random() * 3));
    }, 1000);
    
    // Store interval ID for cleanup
    (window as any).exerciseInterval = interval;
  };

  const stopExercise = () => {
    setIsExercising(false);
    clearInterval((window as any).exerciseInterval);
    
    // Calculate rewards
    const stamina = Math.floor(duration / 10);
    const satiety = Math.floor(steps / 20);
    const mood = Math.floor(duration / 15);
    
    toast.success(`運動完成！獲得：體力+${stamina} 飽食度+${satiety} 心情+${mood}`);
  };

  return (
    <div className="min-h-screen bg-game-bg p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
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
            💡 未來版本將支援加速度感測器與GPS定位，自動偵測運動類型！
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Exercise;
