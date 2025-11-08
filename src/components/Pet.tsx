import { useEffect, useRef, useState } from "react";
import bg from "@/assets/image/background.png";
import badDayBg from "@/assets/image/badday_backgroung.png";
import { useManualRain } from "@/hooks/useWeather";
import PetEggSvg from "@/assets/svg/pet-egg.svg";
import PetSmallSvg from "@/assets/svg/pet-small.svg";
import PetMediumSvg from "@/assets/svg/pet-medium.svg";
import PetLargeSvg from "@/assets/svg/pet-large.svg";
import PetBuffSvg from "@/assets/svg/pet-buff.svg";

// Dynamically load any "side" sprites the designer may add.
// Uses Vite's import.meta.glob to avoid hardcoding file names.
const _sideModules = import.meta.glob('/src/assets/svg/**/pet-*-side.*', { eager: true, as: 'url' }) as Record<string, string>;
const SIDE_MAP: Record<string, string> = {};
for (const p in _sideModules) {
  const m = p.match(/pet-(small|medium|large|buff)-side/i);
  if (m) {
    SIDE_MAP[m[1].toLowerCase()] = _sideModules[p];
  }
}

// Walking frame imports for small pet (8 frames)
import PetSmallWalk1 from "@/assets/svg/pet-small-walk/pet-small-1.png.png";
import PetSmallWalk2 from "@/assets/svg/pet-small-walk/pet-small-2.png.png";
import PetSmallWalk3 from "@/assets/svg/pet-small-walk/pet-small-3.png.png";
import PetSmallWalk4 from "@/assets/svg/pet-small-walk/pet-small-4.png.png";
// import PetSmallWalk5 from "@/assets/svg/pet-small-walk/pet-small-5.png.png";

// Walking frame imports for medium pet (8 frames)
import PetMediumWalk1 from "@/assets/svg/pet-medium-walk/pet-medium-1.png.png";
import PetMediumWalk2 from "@/assets/svg/pet-medium-walk/pet-medium-2.png.png";
import PetMediumWalk3 from "@/assets/svg/pet-medium-walk/pet-medium-3.png.png";
import PetMediumWalk4 from "@/assets/svg/pet-medium-walk/pet-medium-4.png.png";

// Walking frame imports for large pet (partial - will complete later)
import PetLargeWalk1 from "@/assets/svg/pet-large-walk/pet-large-1.png.png";
import PetLargeWalk2 from "@/assets/svg/pet-large-walk/pet-large-2.png.png";
import PetLargeWalk3 from "@/assets/svg/pet-large-walk/pet-large-3.png.png";
import PetLargeWalk4 from "@/assets/svg/pet-large-walk/pet-large-4.png.png";

import PetBuffWalk1 from "@/assets/svg/pet-buff-walk/pet-buff-1.png.png";
import PetBuffWalk2 from "@/assets/svg/pet-buff-walk/pet-buff-2.png.png";
import PetBuffWalk3 from "@/assets/svg/pet-buff-walk/pet-buff-3.png.png";
import PetBuffWalk4 from "@/assets/svg/pet-buff-walk/pet-buff-4.png.png";

// Flying frame imports for small/medium/large pets
import PetSmallFly1 from "@/assets/svg/pet-small-fly/pet-small-1.png.png";
import PetSmallFly2 from "@/assets/svg/pet-small-fly/pet-small-2.png.png";
import PetMediumFly1 from "@/assets/svg/pet-medium-fly/pet-medium-1.png.png";
import PetMediumFly2 from "@/assets/svg/pet-medium-fly/pet-medium-2.png.png";
import PetLargeFly1 from "@/assets/svg/pet-large-fly/pet-large-1.png.png";
import PetLargeFly2 from "@/assets/svg/pet-large-fly/pet-large-2.png.png";

// Frame-based animation system
const getWalkFrame = (stage: string, frameIndex: number, direction: number) => {
  if (stage === "small") {
    const smallWalkFrames = [
      PetSmallWalk1, PetSmallWalk2, PetSmallWalk3, PetSmallWalk4
    ];
    return smallWalkFrames[frameIndex % 4];
  }
  if (stage === "large") {
    const largeWalkFrames = [
      PetLargeWalk1, PetLargeWalk2, PetLargeWalk3, PetLargeWalk4
    ];
    return largeWalkFrames[frameIndex % 4];
  }
  if (stage === "medium") {
    const mediumWalkFrames = [
      PetMediumWalk1, PetMediumWalk2, PetMediumWalk3, PetMediumWalk4
    ];
    return mediumWalkFrames[frameIndex % 4];
  }
  if (stage === "buff") {
    const buffWalkFrames = [
      PetBuffWalk1, PetBuffWalk2, PetBuffWalk3, PetBuffWalk4
    ];
    return buffWalkFrames[frameIndex % 4];
  }
  
  // For other stages, return base SVG for now
  switch (stage) {
    case "medium": return PetMediumSvg;
    case "large": return PetLargeSvg;
    case "buff": return PetBuffSvg;
    default: return PetSmallSvg;
  }
};

// Get fly animation frame (alternates between 2 frames)
const getFlyFrame = (stage: string, frameIndex: number) => {
  if (stage === "small") {
    const smallFlyFrames = [PetSmallFly1, PetSmallFly2];
    return smallFlyFrames[frameIndex % 2];
  }
  
  if (stage === "medium") {
    const mediumFlyFrames = [PetMediumFly1, PetMediumFly2];
    return mediumFlyFrames[frameIndex % 2];
  }
  
  if (stage === "large") {
    const largeFlyFrames = [PetLargeFly1, PetLargeFly2];
    return largeFlyFrames[frameIndex % 2];
  }
  
  return null;
};

interface PetProps {
  stage: "egg" | "small" | "medium" | "large" | "buff";
  mood: number;
  message?: string;
  // when true, allow the 5s show-timer to start; this should be set by the parent
  // when the app has finished entrance/loading and the main page is visible
  startMessageTimer?: boolean;
  // optional stats for on-click messages
  strength?: number;
  strengthMax?: number;
  stamina?: number;
  staminaMax?: number;
}

const Pet = ({ stage, mood, message, startMessageTimer, strength, strengthMax, stamina, staminaMax }: PetProps) => {
  const petRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const [containerSize, setContainerSize] = useState({ width: 300, height: 300 });
  const [showMessage, setShowMessage] = useState<boolean>(false);

  // Animation states
  const [isJumping, setIsJumping] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyFrame, setFlyFrame] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const [walkCycle, setWalkCycle] = useState(0);
  const [isTurning, setIsTurning] = useState(false);
  const turnTimerRef = useRef<number | null>(null);
  const prevDirectionRef = useRef(direction);

  // manual (click-triggered) message management
  const manualTimerRef = useRef<number | null>(null);
  const [manualMessage, setManualMessage] = useState<string | undefined>(undefined);
  const [cycleIdx, setCycleIdx] = useState<number>(-1); // -1 means no manual cycle active

  // auto (startup) message (we show mood for 5s when startMessageTimer becomes true)
  const autoTimerRef = useRef<number | null>(null);
  const [autoMessage, setAutoMessage] = useState<string | undefined>(undefined);
  // track whether we've already shown the auto (entrance) message once
  const autoShownRef = useRef<boolean>(false);
  // bubble measurement so we can place its bottom at the top of the pet
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [bubbleHeight, setBubbleHeight] = useState<number>(0);
  const [bubbleWidth, setBubbleWidth] = useState<number>(200);

  const { manualRain } = useManualRain();

  // measure bubble height so we can position it exactly above the pet
  useEffect(() => {
    const measure = () => {
      const el = bubbleRef.current;
      if (el) {
        setBubbleHeight(el.clientHeight);
        setBubbleWidth(el.clientWidth);
      }
    };

    if ((manualMessage ?? autoMessage ?? message) && showMessage) {
      // measure on next frame after render
      requestAnimationFrame(measure);
    } else {
      setBubbleHeight(0);
    }
  }, [manualMessage, autoMessage, message, showMessage, position.x, position.y, containerSize.width]);

  

  

  const petSizes = {
    egg: 40,
    small: 50,
    medium: 65,
    large: 80,
    buff: 95,
  } as const;

  const petSize = petSizes[stage];
  const groundLevel = containerSize.height - petSize - 20;

  // if the bubble would overlap the pet (not enough space above), shift the pet down
  useEffect(() => {
    if (!showMessage) return;
    if (!bubbleHeight) return;

    const gap = 6; // px between bubble bottom and pet top
    const topMargin = 8; // min top padding

    const bubbleTop = position.y - bubbleHeight - gap;
    if (bubbleTop < topMargin) {
      const shift = topMargin - bubbleTop;
      setPosition((prev) => {
        const maxY = Math.max(0, containerSize.height - petSize);
        const newY = Math.min(prev.y + shift, maxY);
        return { ...prev, y: newY };
      });
    }
  }, [bubbleHeight, showMessage, position.y, containerSize.height, petSize]);

  // compute bubble position using the actual DOM position of the pet when possible
  // This ensures the bubble visually follows the pet (even during CSS transitions)
  let computedBubbleTop = Math.max(8, position.y - petSize * 0.8);
  let computedBubbleLeft = position.x + petSize / 2;

  try {
    const petEl = petRef.current;
    const containerEl = containerRef.current;
    if (petEl && containerEl) {
      const petRect = petEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      // center relative to container
      const centerX = petRect.left - containerRect.left + petRect.width / 2;
      const topFromPet = petRect.top - containerRect.top - bubbleHeight - 6;

      // clamp horizontally to container with padding
      const half = bubbleWidth > 0 ? bubbleWidth / 2 : 100;
      const padding = 8;
      const minCenter = half + padding;
      const maxCenter = Math.max(minCenter, containerSize.width - half - padding);

      computedBubbleLeft = Math.min(Math.max(centerX, minCenter), maxCenter);
      computedBubbleTop = bubbleHeight > 0 ? Math.max(8, topFromPet) : Math.max(8, position.y - petSize * 0.8);
    } else {
      // fallback to logical position if DOM not available
      computedBubbleTop = bubbleHeight > 0 ? Math.max(8, position.y - bubbleHeight - 6) : Math.max(8, position.y - petSize * 0.8);
      const centerX = position.x + petSize / 2;
      const half = bubbleWidth > 0 ? bubbleWidth / 2 : 100;
      const padding = 8; // keep some padding from edges
      const minCenter = half + padding;
      const maxCenter = Math.max(minCenter, containerSize.width - half - padding);
      computedBubbleLeft = Math.min(Math.max(centerX, minCenter), maxCenter);
    }
  } catch (e) {
    // if anything goes wrong, gracefully fallback to previous calculation
    computedBubbleTop = bubbleHeight > 0 ? Math.max(8, position.y - bubbleHeight - 6) : Math.max(8, position.y - petSize * 0.8);
    const centerX = position.x + petSize / 2;
    const half = bubbleWidth > 0 ? bubbleWidth / 2 : 100;
    const padding = 8; // keep some padding from edges
    const minCenter = half + padding;
    const maxCenter = Math.max(minCenter, containerSize.width - half - padding);
    computedBubbleLeft = Math.min(Math.max(centerX, minCenter), maxCenter);
  }

  // measure container and update on resize
  useEffect(() => {
    const updateSize = () => {
      const el = containerRef.current;
      if (el) {
        const w = el.clientWidth;
        const h = el.clientHeight;
        setContainerSize({ width: w, height: h });
        // clamp pet position
        setPosition((prev) => ({
          x: Math.max(0, Math.min(prev.x, w - petSize)),
          y: Math.max(0, Math.min(prev.y, h - petSize)),
        }));
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [petSize]);

  // Set initial position based on stage
  useEffect(() => {
    if (stage === 'egg') {
      setPosition({
        x: containerSize.width / 2 - petSize / 2,
        y: containerSize.height / 2 - petSize / 2 + 60
      });
    } else {
      setPosition({
        x: 0,
        y: groundLevel
      });
    }
  }, [stage, petSize, groundLevel, containerSize]);

  // Device motion detection for flying/jumping
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (!event.accelerationIncludingGravity) return;
      
      const { y } = event.accelerationIncludingGravity;
      const upwardAcceleration = -(y || 0);
      const flyThreshold = 15;
      
      if (upwardAcceleration > flyThreshold && !isJumping && !isFlying && stage !== 'egg') {
        if (stage === 'buff') {
          performJump();
        } else {
          performFly();
        }
      }
    };

    const requestMotionPermission = async () => {
      if (typeof DeviceMotionEvent !== 'undefined' && 'requestPermission' in DeviceMotionEvent) {
        try {
          const response = await (DeviceMotionEvent as any).requestPermission();
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
          }
        } catch (error) {
          console.error('Error requesting motion permission:', error);
          window.addEventListener('devicemotion', handleDeviceMotion);
        }
      } else {
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    };

    requestMotionPermission();

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [isJumping, isFlying, stage]);

  // Horizontal walking movement - replace the old bouncing logic
  useEffect(() => {
    if (stage === 'egg' || isJumping || isFlying) {
      return; // Eggs don't move, and don't walk while jumping/flying
    }

    const walkInterval = setInterval(() => {
      setPosition((prev) => {
        const currentX = prev.x;
        let newX = currentX + (direction * 2); // Walking speed
        
        // Calculate collision box boundaries
        const petLeftEdge = newX;
        const petRightEdge = newX + petSize;
        const containerLeftEdge = 0;
        const containerRightEdge = containerSize.width;
        
        // Collision detection - only change direction when actually hitting boundaries
        if (petLeftEdge <= containerLeftEdge) {
          // Hit left wall - set position to exact boundary
          newX = containerLeftEdge;
          setDirection(1);
        } else if (petRightEdge >= containerRightEdge) {
          // Hit right wall - set position so right edge touches boundary
          newX = containerRightEdge - petSize;
          setDirection(-1);
        }
        
        // Random direction change occasionally (very rare)
        if (Math.random() > 0.998) {
          setDirection(prev => -prev);
        }

        return { x: newX, y: prev.y };
      });
      
      // Update walk cycle for animation (8 frames)
      setWalkCycle(prev => (isTurning ? prev : (prev + 1) % 8));
    }, 100);

    return () => clearInterval(walkInterval);
  }, [direction, petSize, stage, containerSize.width, isJumping, isFlying, isTurning]);

  // When direction changes, show a side sprite briefly before resuming walk
  useEffect(() => {
    if (prevDirectionRef.current !== direction) {
      // only show side sprite for non-egg stages and when not jumping/flying
      if (stage !== 'egg' && !isJumping && !isFlying) {
        setIsTurning(true);
        if (turnTimerRef.current) {
          clearTimeout(turnTimerRef.current);
        }
        // show side sprite for 220ms (one frame)
        turnTimerRef.current = window.setTimeout(() => {
          setIsTurning(false);
          turnTimerRef.current = null;
        }, 220);
      }
    }
    prevDirectionRef.current = direction;

    return () => {
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
        turnTimerRef.current = null;
      }
    };
  }, [direction, stage, isJumping, isFlying]);

  // Jump function
  const performJump = () => {
    if (isJumping || isFlying) return;
    
    setIsJumping(true);
    
    const jumpHeight = 80;
    const jumpDuration = 1000;
    const startY = position.y;
    const startTime = Date.now();
    
    const animateJump = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / jumpDuration;
      
      if (progress < 1) {
        const height = jumpHeight * Math.sin(progress * Math.PI);
        // move the pet up by setting y = groundLevel - height (clamped to >= 0)
        const newY = Math.max(0, groundLevel - height);
        setPosition(prev => ({ ...prev, y: newY }));
        requestAnimationFrame(animateJump);
      } else {
        // ensure we land exactly on the ground level
        setPosition(prev => ({ ...prev, y: groundLevel }));
        setIsJumping(false);
      }
    };
    
    requestAnimationFrame(animateJump);
  };

  // Fly function - triggered by upward shake
  const performFly = () => {
    if (isFlying || isJumping) return;
    
    setIsFlying(true);
    
    const flyHeight = 150;
    const flyUpDuration = 800;
    const flyDownDuration = 1000;
    const startY = position.y;
    const startTime = Date.now();
    
    const flyFrameInterval = setInterval(() => {
      setFlyFrame(prev => (prev + 1) % 2);
    }, 150);
    
    const animateFlyUp = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / flyUpDuration;
      
      if (progress < 1) {
        const height = flyHeight * (1 - Math.pow(1 - progress, 2));
        setPosition(prev => ({ ...prev, y: Math.max(0, groundLevel - height) }));
        requestAnimationFrame(animateFlyUp);
      } else {
        // Calculate the actual highest point position
        const peakY = Math.max(0, groundLevel - flyHeight);
        const fallStartTime = Date.now();
        
        const animateFlyDown = () => {
          const fallElapsed = Date.now() - fallStartTime;
          const fallProgress = fallElapsed / flyDownDuration;
          
          if (fallProgress < 1) {
            const fallDistance = (groundLevel - peakY) * Math.pow(fallProgress, 2);
            setPosition(prev => ({ ...prev, y: Math.min(groundLevel, peakY + fallDistance) }));
            requestAnimationFrame(animateFlyDown);
          } else {
            clearInterval(flyFrameInterval);
            setPosition(prev => ({ ...prev, y: groundLevel }));
            setIsFlying(false);
            setFlyFrame(0);
          }
        };
        
        requestAnimationFrame(animateFlyDown);
      }
    };
    
    requestAnimationFrame(animateFlyUp);
  };

  const getPetIcon = () => {
    if (stage === "egg") return PetEggSvg;

    // if we're currently turning, prefer the side sprite if available
    if (isTurning) {
      const side = SIDE_MAP[stage];
      if (side) return side;
    }
    
    // Use fly frames when flying (for small/medium/large)
    if (isFlying) {
      const flyFrameIcon = getFlyFrame(stage, flyFrame);
      if (flyFrameIcon) return flyFrameIcon;
    }
    
    // Use walking frames when not jumping/flying
    if (!isJumping) {
      return getWalkFrame(stage, walkCycle, direction);
    }
    
    // Default static icons for jumping or fallback
    switch (stage) {
      case "small": return PetSmallSvg;
      case "medium": return PetMediumSvg;
      case "large": return PetLargeSvg;
      case "buff": return PetBuffSvg;
      default: return PetSmallSvg;
    }
  };

  // show auto mood message for 5s only once when startMessageTimer becomes true
  // (do not re-trigger after manual messages finish)
  useEffect(() => {
    // if already shown once, do nothing
    if (autoShownRef.current) return;

    // if there's a manual message active, defer until manual completes but still only once
    if (manualMessage) return;

    if (startMessageTimer) {
      // generate mood message and show for 5s
      const msg = genMoodMessage(mood);
      setAutoMessage(msg);
      setShowMessage(true);
      autoShownRef.current = true; // mark as shown so we won't show again

      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      autoTimerRef.current = window.setTimeout(() => {
        setAutoMessage(undefined);
        setShowMessage(false);
        autoTimerRef.current = null;
      }, 5000);
    }

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
    // only run when startMessageTimer or mood or manualMessage changes
  }, [startMessageTimer, mood, manualMessage]);

  // cleanup manual timer on unmount
  useEffect(() => {
    return () => {
      if (manualTimerRef.current) {
        clearTimeout(manualTimerRef.current);
        manualTimerRef.current = null;
      }
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, []);

  // helper message generators
  const genStrengthMessage = (value?: number, max = 120) => {
    if (value == null) return "力量資訊不可用";
    if (value <= 0) return `今天還沒有運動，趕快來訓練吧！💤`;
    if (value < max / 4) return `力量很低，需要多做基礎訓練並給予休息或營養補充。`;
    if (value < max / 2) return `力量有點不足，持續訓練會有提升喔！`;
    return `力量良好，繼續保持！`;
  };

  const genStaminaMessage = (value?: number, max = 900) => {
    if (value == null) return "體力資訊不可用";
    if (value <= 0) return `咕咕！今天運動量已經足夠了，明天繼續加油！🌟`;
    if (value < max / 4) return `體力很低，先休息並補充能量吧！`;
    if (value < max / 2) return `體力有點不足，建議做溫和運動恢復。`;
    return `體力狀態良好，可以安心運動。`;
  };

  const genMoodMessage = (moodVal?: number) => {
    if (moodVal == null) return "心情資訊不可用";
    if (moodVal <= 0) return `心情好糟糕QQ 需要運動一下緩解心情！💤`;
    if (moodVal <= 40) return `心情較差，可以做些放鬆或聽音樂喔。`;
    if (moodVal <= 60) return `心情還好，咕咕～感覺還不錯呢！`;
    return `咕咕！心情超好，繼續保持運動習慣喔！💪`;
  };

  const handlePetClick = () => {
    // Cycle through: 0 = strength, 1 = stamina, 2 = mood, then back to 0.
    // If a manual timer exists, cancel it and immediately advance to the next stage.
    performFly();
    if (manualTimerRef.current) {
      clearTimeout(manualTimerRef.current);
      manualTimerRef.current = null;
    }

    const next = (cycleIdx + 1) % 3; // if cycleIdx === -1 => ( -1 +1 ) %3 = 0 in JS gives 0? ensure positive
    // normalize for -1 case
    const normalizedNext = cycleIdx === -1 ? 0 : next;

    let msg: string | undefined;
    if (normalizedNext === 0) {
      msg = genStrengthMessage(strength, strengthMax ?? 120);
    } else if (normalizedNext === 1) {
      msg = genStaminaMessage(stamina, staminaMax ?? 900);
    } else {
      msg = genMoodMessage(mood);
    }

    setCycleIdx(normalizedNext);
    setManualMessage(msg);
    setShowMessage(true);

    manualTimerRef.current = window.setTimeout(() => {
      setManualMessage(undefined);
      setShowMessage(false);
      // keep cycleIdx at normalizedNext so next click advances the cycle
      // but if we just showed mood (2), leave cycleIdx as 2 so next click wraps to 0
      manualTimerRef.current = null;
    }, 5000);
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl shadow-inner overflow-hidden w-full"
      style={{
        aspectRatio: "1 / 1",
        backgroundImage: `url(${manualRain ? badDayBg : bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        ref={petRef}
        className="absolute transition-all duration-200 flex items-center justify-center cursor-pointer"
        onClick={handlePetClick}
        style={{
          width: petSize,
          height: petSize,
          left: position.x,
          top: position.y,
          filter: mood < 40 ? "grayscale(30%)" : "none",
          transform: `scaleX(${direction > 0 ? 1 : -1})`,
          // keep pet & bubble transitions consistent to avoid visual desync
          transition: isJumping ? "none" : "left 120ms linear, top 120ms linear, transform 120ms linear"
        }}
      >
        <img 
          src={getPetIcon()} 
          alt={`Pet ${stage}`}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* displayedMessage prefers manualMessage -> autoMessage -> parent message */}
      {((manualMessage ?? autoMessage ?? message) && showMessage) && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: computedBubbleLeft,
            top: computedBubbleTop,
            transform: "translateX(-50%)",
            maxWidth: 200,
            zIndex: 20,
            transition: "left 0.12s linear, top 0.12s linear",
          }}
        >
              <div style={{ position: "relative" }} ref={bubbleRef}>
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: "#EDF8FA",
                    color: "var(--tp-grayscale-800)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    width: 200,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    borderRadius: 12,
                  }}
                >
                  {manualMessage ?? autoMessage ?? message}
                </div>
              </div>
        </div>
      )}
    </div>
  );
};

export default Pet;
