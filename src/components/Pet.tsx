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
      className="relative rounded-2xl shadow-inner overflow-hidden"
      style={{ 
        width: containerSize.width, 
        height: containerSize.height,
        background: 'linear-gradient(to bottom, var(--tp-primary-200) 0%, #90c956 50%, #7ab642 100%)'
      }}
    >
      {/* Grass decorations */}
      <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end justify-around">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="w-1 rounded-t-full animate-pulse"
            style={{
              height: `${Math.random() * 20 + 10}px`,
              backgroundColor: 'var(--tp-primary-600)',
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
      
      <div
        ref={petRef}
        className="absolute transition-all duration-200 flex items-center justify-center"
        style={{
          width: petSize,
          height: petSize,
          left: position.x,
          top: position.y,
          fontSize: petSize * 0.8,
          filter: mood < 40 ? 'grayscale(30%)' : 'none',
          transform: `scaleX(${velocity.x > 0 ? 1 : -1})`,
          animation: 'bounce 0.5s infinite'
        }}
      >
        {getPetEmoji()}
      </div>
    </div>
  );
};

export default Pet;
