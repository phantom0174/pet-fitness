import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Pet from "@/components/Pet";
import StatBar from "@/components/StatBar";
import ActionButton from "@/components/ActionButton";
import { Dumbbell, Map, Calendar, Settings } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [petStage, setPetStage] = useState<"egg" | "small" | "medium" | "large" | "buff">("small");
  const [stats, setStats] = useState({
    strength: 45,
    stamina: 60,
    satiety: 75,
    mood: 80,
    level: 3,
  });

  return (
    <div className="min-h-screen bg-game-bg">
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">運動之都</h1>
            <p className="text-sm text-muted-foreground">我的手雞 Lv.{stats.level}</p>
          </div>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Pet Display */}
        <Card className="p-6 space-y-4">
          <div className="flex justify-center">
            <Pet stage={petStage} mood={stats.mood} />
          </div>
          
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {petStage === "egg" && "蛋"}
              {petStage === "small" && "小雞"}
              {petStage === "medium" && "中雞"}
              {petStage === "large" && "大雞"}
              {petStage === "buff" && "大胸雞"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {stats.mood > 70 && "心情超好！"}
              {stats.mood > 40 && stats.mood <= 70 && "狀態不錯"}
              {stats.mood <= 40 && "需要關注..."}
            </p>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground mb-2">能力值</h3>
          <StatBar label="力量值" value={stats.strength} max={100} icon="💪" />
          <StatBar label="體力值" value={stats.stamina} max={100} icon="❤️" />
          <StatBar label="飽食度" value={stats.satiety} max={100} icon="🍚" />
          <StatBar label="心情" value={stats.mood} max={100} icon="😊" />
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            icon={Dumbbell}
            label="運動"
            onClick={() => navigate("/exercise")}
          />
          <ActionButton
            icon={Map}
            label="旅遊"
            onClick={() => navigate("/travel")}
            variant="accent"
          />
        </div>

        {/* Daily Missions Preview */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              每日任務
            </h3>
            <span className="text-xs text-muted-foreground">0/3 完成</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 border-2 border-muted rounded" />
              <span className="text-muted-foreground">運動10分鐘</span>
              <span className="ml-auto text-accent text-xs">+10體力</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 border-2 border-muted rounded" />
              <span className="text-muted-foreground">走路5000步</span>
              <span className="ml-auto text-accent text-xs">+5心情</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 border-2 border-muted rounded" />
              <span className="text-muted-foreground">拜訪一個景點</span>
              <span className="ml-auto text-accent text-xs">+15成長</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
