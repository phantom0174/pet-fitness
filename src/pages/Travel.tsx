import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const landmarks = [
  { name: "台北101", description: "台北最高地標", bonus: "力量值 +10" },
  { name: "象山步道", description: "登高望遠好去處", bonus: "體力值 +15" },
  { name: "大安森林公園", description: "都市綠洲", bonus: "心情 +10" },
  { name: "陽明山", description: "自然步道天堂", bonus: "成長值 +5" },
  { name: "北投溫泉", description: "放鬆身心靈", bonus: "心情 +15" },
];

const Travel = () => {
  const navigate = useNavigate();
  const currentLandmark = landmarks[Math.floor(Math.random() * landmarks.length)];

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
          <h1 className="text-2xl font-bold text-center text-primary">旅遊突破</h1>
          
          <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="bg-primary text-primary-foreground rounded-full p-4">
                <MapPin className="w-8 h-8" />
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {currentLandmark.name}
              </h2>
              <p className="text-muted-foreground">
                {currentLandmark.description}
              </p>
            </div>

            <div className="bg-card rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">完成獎勵</span>
              <span className="font-semibold text-accent flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                {currentLandmark.bonus}
              </span>
            </div>
          </div>

          <Button size="lg" className="w-full" disabled>
            前往景點（開發中）
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground">台北運動景點</h3>
          <div className="space-y-2">
            {landmarks.map((landmark, index) => (
              <div
                key={index}
                className="bg-muted rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-sm">{landmark.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {landmark.description}
                  </div>
                </div>
                <div className="text-xs text-accent">{landmark.bonus}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-accent/10 border-accent">
          <p className="text-sm text-center text-accent-foreground">
            💡 未來將串接台北市公開資料API，顯示真實景點與運動場館！
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Travel;
