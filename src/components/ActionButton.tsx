import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "accent";
}

const ActionButton = ({ icon: Icon, label, onClick, variant = "default" }: ActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={`flex-1 h-16 flex flex-col items-center justify-center gap-1 ${
        variant === "accent" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""
      }`}
      variant={variant === "default" ? "default" : undefined}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
};

export default ActionButton;
