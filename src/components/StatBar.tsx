import { Progress } from "@/components/ui/progress";

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  icon: string;
}

const StatBar = ({ label, value, max, icon }: StatBarProps) => {
  const percentage = (value / max) * 100;
  
  const getStatColor = () => {
    if (percentage > 70) return "stat-good";
    if (percentage > 40) return "stat-medium";
    return "stat-low";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-foreground">
          <span>{icon}</span>
          <span className="font-medium">{label}</span>
        </span>
        <span className="text-muted-foreground">
          {value}/{max}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

export default StatBar;
