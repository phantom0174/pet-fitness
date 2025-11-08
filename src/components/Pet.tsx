import { useEffect, useRef, useState } from "react";

interface PetProps {
  stage: "egg" | "small" | "medium" | "large" | "buff";
  mood: number;
}

const Pet = ({ stage, mood }: PetProps) => {
  const petRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const [velocity, setVelocity] = useState({ x: 1, y: 1 });
  const containerSize = { width: 300, height: 300 };
  
  const petSizes = {
    egg: 40,
    small: 50,
    medium: 65,
    large: 80,
    buff: 95,
  };
  
  const petSize = petSizes[stage];

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        let newX = prev.x + velocity.x;
        let newY = prev.y + velocity.y;
        let newVelX = velocity.x;
        let newVelY = velocity.y;

        // Collision detection with boundaries
        if (newX <= 0 || newX + petSize >= containerSize.width) {
          newVelX = -velocity.x;
          newX = Math.max(0, Math.min(newX, containerSize.width - petSize));
        }
        
        if (newY <= 0 || newY + petSize >= containerSize.height) {
          newVelY = -velocity.y;
          newY = Math.max(0, Math.min(newY, containerSize.height - petSize));
        }

        setVelocity({ x: newVelX, y: newVelY });
        
        // Random direction change occasionally
        if (Math.random() > 0.98) {
          setVelocity({
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
          });
        }

        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [velocity, petSize]);

  const getPetColor = () => {
    if (mood > 70) return "bg-primary";
    if (mood > 40) return "bg-stat-medium";
    return "bg-stat-low";
  };

  const getPetEmoji = () => {
    switch (stage) {
      case "egg": return "🥚";
      case "small": return "🐣";
      case "medium": return "🐤";
      case "large": return "🐥";
      case "buff": return "💪🐔";
      default: return "🐣";
    }
  };

  return (
    <div 
      className="relative bg-game-pet-area rounded-2xl shadow-inner overflow-hidden"
      style={{ width: containerSize.width, height: containerSize.height }}
    >
      <div
        ref={petRef}
        className={`absolute rounded-lg ${getPetColor()} transition-colors duration-500 flex items-center justify-center text-2xl`}
        style={{
          width: petSize,
          height: petSize,
          left: position.x,
          top: position.y,
        }}
      >
        {getPetEmoji()}
      </div>
    </div>
  );
};

export default Pet;
