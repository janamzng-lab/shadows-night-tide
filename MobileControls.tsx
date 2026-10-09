import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Crosshair, 
  RotateCcw, 
  ArrowUp, 
  Flashlight, 
  Hand, 
  ChevronsUp, 
  ArrowDown, 
  RefreshCw 
} from 'lucide-react';

interface MobileControlsProps {
  onMove: (move: { x: number; y: number }) => void;
  onLook: (deltaYaw: number, deltaPitch: number) => void;
  onFire: (isFiring: boolean) => void;
  onAim: (isAiming: boolean) => void;
  onReload: () => void;
  onJump: () => void;
  onCrouch: () => void;
  onSprint: (isSprinting: boolean) => void;
  onFlashlight: () => void;
  onInteract: () => void;
  onCycleWeapon: () => void;
  sensitivity: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onLook,
  onFire,
  onAim,
  onReload,
  onJump,
  onCrouch,
  onSprint,
  onFlashlight,
  onInteract,
  onCycleWeapon,
  sensitivity,
}) => {
  // Virtual Joystick state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera Touch Drag state
  const lookAreaRef = useRef<HTMLDivElement>(null);
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Button hold states
  const [isFiringHeld, setIsFiringHeld] = useState<boolean>(false);
  const [isAimingHeld, setIsAimingHeld] = useState<boolean>(false);
  const [isSprintingHeld, setIsSprintingHeld] = useState<boolean>(false);

  // Joystick touch handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setIsJoystickActive(true);

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    if (!isJoystickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;

        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const stickX = Math.cos(angle) * clampedDist;
        const stickY = Math.sin(angle) * clampedDist;

        setStickPos({ x: stickX, y: stickY });
        onMove({ x: stickX / maxRadius, y: stickY / maxRadius });
      }
    }
  }, [isJoystickActive, onMove]);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setIsJoystickActive(false);
        setStickPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
      }
    }
  }, [onMove]);

  // Look touch drag handlers
  const handleLookStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    lookTouchId.current = touch.identifier;
    lastLookPos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleLookMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };

        const sensFactor = 0.0035 * (sensitivity / 50);
        onLook(-dx * sensFactor, -dy * sensFactor);
      }
    }
  }, [onLook, sensitivity]);

  const handleLookEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  }, []);

  // Fire button
  const handleFireDown = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsFiringHeld(true);
    onFire(true);
    if ('vibrate' in navigator) navigator.vibrate(20);
  };
  const handleFireUp = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsFiringHeld(false);
    onFire(false);
  };

  // Aim button
  const handleAimDown = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsAimingHeld(true);
    onAim(true);
  };
  const handleAimUp = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsAimingHeld(false);
    onAim(false);
  };

  // Sprint button
  const handleSprintDown = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsSprintingHeld(true);
    onSprint(true);
  };
  const handleSprintUp = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsSprintingHeld(false);
    onSprint(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none overflow-hidden touch-none">
      {/* LEFT ZONE: Virtual Joystick & Sprint */}
      <div className="absolute left-6 bottom-8 pointer-events-auto flex items-end gap-3">
        {/* Joystick Base */}
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
          className="relative w-32 h-32 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl"
        >
          {/* Inner Stick */}
          <div
            className="w-12 h-12 rounded-full bg-slate-300/80 border border-white/60 shadow-lg pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          />
        </div>

        {/* Sprint Button */}
        <button
          onTouchStart={handleSprintDown}
          onTouchEnd={handleSprintUp}
          onTouchCancel={handleSprintUp}
          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-mono-hud border transition-colors shadow-lg ${
            isSprintingHeld ? 'bg-amber-600 border-amber-400 text-white' : 'bg-black/60 border-white/20 text-slate-300'
          }`}
        >
          <ChevronsUp className="w-5 h-5" />
          <span className="text-[9px]">RUN</span>
        </button>
      </div>

      {/* RIGHT ZONE: Camera Look Surface */}
      <div
        ref={lookAreaRef}
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
        className="absolute right-0 top-16 bottom-0 w-1/2 pointer-events-auto z-10"
      />

      {/* RIGHT ACTION BUTTONS CLUSTER */}
      <div 
        className="absolute right-6 bottom-8 pointer-events-auto z-30 flex flex-col items-end gap-3"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Upper Row: Weapon Swap, Reload, Interact, Flashlight */}
        <div className="flex items-center gap-2">
          {/* Flashlight */}
          <button
            onTouchStart={(e) => { 
              e.stopPropagation(); 
              onFlashlight(); 
              if ('vibrate' in navigator) navigator.vibrate(10);
            }}
            className="w-11 h-11 rounded-full bg-black/60 border border-white/20 text-slate-300 flex items-center justify-center active:bg-amber-600 shadow-md"
          >
            <Flashlight className="w-5 h-5" />
          </button>

          {/* Interact [E] */}
          <button
            onTouchStart={(e) => { 
              e.stopPropagation(); 
              onInteract(); 
              if ('vibrate' in navigator) navigator.vibrate(20);
            }}
            className="w-12 h-12 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 flex flex-col items-center justify-center active:bg-emerald-700 shadow-md"
          >
            <Hand className="w-5 h-5" />
            <span className="text-[8px] font-mono-hud font-bold">USE</span>
          </button>

          {/* Reload [R] */}
          <button
            onTouchStart={(e) => { 
              e.stopPropagation(); 
              onReload(); 
              if ('vibrate' in navigator) navigator.vibrate(15);
            }}
            className="w-12 h-12 rounded-full bg-black/60 border border-white/20 text-slate-300 flex flex-col items-center justify-center active:bg-slate-700 shadow-md"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[8px] font-mono-hud">LOAD</span>
          </button>

          {/* Weapon Swap */}
          <button
            onTouchStart={(e) => { 
              e.stopPropagation(); 
              onCycleWeapon(); 
              if ('vibrate' in navigator) navigator.vibrate(15);
            }}
            className="w-12 h-12 rounded-full bg-slate-900/80 border border-white/20 text-amber-300 flex flex-col items-center justify-center active:bg-amber-700 shadow-md"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[8px] font-mono-hud">SWAP</span>
          </button>
        </div>

        {/* Lower Row: Crouch, Jump, Aim, Fire */}
        <div className="flex items-center gap-3">
          {/* Crouch */}
          <button
            onTouchStart={(e) => { 
              e.stopPropagation(); 
              onCrouch(); 
            }}
            className="w-12 h-12 rounded-full bg-black/60 border border-white/20 text-slate-300 flex items-center justify-center active:bg-slate-700 shadow-md"
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          {/* Jump */}
          <button
            onTouchStart={(e) => { 
              e.stopPropagation(); 
              onJump(); 
              if ('vibrate' in navigator) navigator.vibrate(20);
            }}
            className="w-12 h-12 rounded-full bg-black/60 border border-white/20 text-slate-300 flex items-center justify-center active:bg-slate-700 shadow-md"
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* Aim (ADS) */}
          <button
            onTouchStart={handleAimDown}
            onTouchEnd={handleAimUp}
            onTouchCancel={handleAimUp}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-mono-hud border transition-colors shadow-lg ${
              isAimingHeld ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/60 border-white/20 text-slate-300'
            }`}
          >
            <Crosshair className="w-6 h-6" />
            <span className="text-[9px]">AIM</span>
          </button>

          {/* Primary FIRE button (large and prominent) */}
          <button
            onTouchStart={handleFireDown}
            onTouchEnd={handleFireUp}
            onTouchCancel={handleFireUp}
            className={`w-18 h-18 rounded-full flex flex-col items-center justify-center text-xs font-mono-hud font-bold border-2 transition-transform shadow-2xl ${
              isFiringHeld 
                ? 'bg-red-600 border-red-300 text-white scale-95 shadow-[0_0_20px_rgba(239,68,68,0.8)]' 
                : 'bg-red-950/80 border-red-500/60 text-red-200'
            }`}
          >
            <span className="text-base tracking-wider">FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
