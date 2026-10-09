/**
 * SHADOWS: NIGHT TIDE — 3D Survival Horror Game
 * Main Application Component coordinating Three.js Game Engine,
 * HUD, Touch Controls, Monster Encyclopedia, Night Coins Shop, and Overlays.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { GameEngine } from './game/engine';
import type { PlayerState, GameSettings } from './game/types';
import { INITIAL_WEAPONS } from './game/weapons';
import { horrorAudio } from './game/audio';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { StartMenu, GameOverOverlay, VictoryOverlay } from './components/MenuOverlays';
import { MonsterCatalogModal } from './components/MonsterCatalogModal';
import { ShopModal } from './components/ShopModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const isInitializingEngineRef = useRef(false);

  // Game UI States
  const [gameStatus, setGameStatus] = useState<'MENU' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('MENU');
  const [catalogOpen, setCatalogOpen] = useState<boolean>(false);
  const [shopOpen, setShopOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    language: 'en',
    masterVolume: 0.8,
    sfxVolume: 0.85,
    ambienceVolume: 0.65,
    musicVolume: 0.7,
    muted: false,
    sensitivity: 50,
    graphicsQuality: 'high',
    reducedFlashing: false,
    filmGrainEnabled: true,
  });

  // Player state mirrored for HUD
  const [playerState, setPlayerState] = useState<PlayerState>({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    battery: 100,
    maxBattery: 100,
    fear: 0,
    maxFear: 100,
    fearCause: 'none',
    flashlightOn: true,
    coins: 100,
    weapons: INITIAL_WEAPONS,
    currentWeaponId: 'pistol',
    inventory: { keycards: [], medkits: 1 },
    objective: 'Search Sector 4 Lab. Find Blue Security Keycard to proceed.',
    objectiveAr: 'ابحث في مختبر القطاع 4. اعثر على بطاقة الأمان الزرقاء للتقدم.',
    isSprinting: false,
    isCrouching: false,
    isGrounded: true,
  });

  const [activeBoss, setActiveBoss] = useState<{ name: string; health: number; maxHealth: number } | null>(null);
  const [promptMessage, setPromptMessage] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [isEngineLoading, setIsEngineLoading] = useState<boolean>(false);

  // Detect touch screens & orientation for mobile landscape enforcement
  useEffect(() => {
    const checkOrientation = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(hasTouch && isPortraitMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  // Freeze gameplay whenever an overlay is open or the player cannot play.
  useEffect(() => {
    engineRef.current?.setPaused(
      gameStatus !== 'PLAYING' || catalogOpen || shopOpen || settingsOpen || isPortrait
    );
  }, [gameStatus, catalogOpen, shopOpen, settingsOpen, isPortrait]);

  // Initialize or re-create game engine
  const initEngine = async () => {
    if (!canvasContainerRef.current) return;
    if (isInitializingEngineRef.current) return;
    isInitializingEngineRef.current = true;
    setIsEngineLoading(true);

    if (engineRef.current) {
      engineRef.current.destroy();
      canvasContainerRef.current.innerHTML = '';
    }

    try {
      setStartupError(null);
      const { GameEngine } = await import('./game/engine');
      const container = canvasContainerRef.current;
      if (!container) return;

      const engine = new GameEngine(
        container,
        {
          onPlayerUpdate: (p) => setPlayerState({ ...p }),
          onBossUpdate: (b) => setActiveBoss(b),
          onPromptUpdate: (msg) => {
            setPromptMessage(msg);
            if (msg) setTimeout(() => setPromptMessage(null), 3500);
          },
          onGameOver: () => {
            engineRef.current?.setPaused(true);
            setGameStatus('GAMEOVER');
          },
          onVictory: () => {
            engineRef.current?.setPaused(true);
            setGameStatus('VICTORY');
          },
          onOpenShop: () => {
            setShopOpen(true);
          },
          onDamageFlash: () => {
            if (!settings.reducedFlashing) {
              setDamageFlash(true);
              setTimeout(() => setDamageFlash(false), 200);
            }
          },
        },
        settings
      );

      engineRef.current = engine;
      engine.start();
    } catch (error) {
      console.error('SHADOWS startup failed:', error);
      setStartupError('The game could not start. Please reload the page or lower graphics quality.');
      setGameStatus('MENU');
      engineRef.current?.destroy();
      engineRef.current = null;
    } finally {
      isInitializingEngineRef.current = false;
      setIsEngineLoading(false);
    }
  };

  const handleStartGame = () => {
    horrorAudio.init();
    horrorAudio.resume();
    setGameStatus('PLAYING');
    initEngine();
  };

  const handleRestart = () => {
    setGameStatus('PLAYING');
    initEngine();
  };

  const handleReturnMenu = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setGameStatus('MENU');
    setActiveBoss(null);
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      horrorAudio.setVolumes(
        updated.masterVolume,
        updated.sfxVolume,
        updated.ambienceVolume,
        updated.musicVolume,
        updated.muted
      );
      if (engineRef.current) {
        engineRef.current.updateSettings(updated);
      }
      return updated;
    });
  };

  const handleToggleMute = () => {
    handleUpdateSettings({ muted: !settings.muted });
  };

  const handleToggleLanguage = () => {
    handleUpdateSettings({ language: settings.language === 'en' ? 'ar' : 'en' });
  };

  const handleCanvasClick = () => {
    if (gameStatus === 'PLAYING' && !catalogOpen && !shopOpen && !settingsOpen && !isTouchDevice) {
      engineRef.current?.requestPointerLock();
    }
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-black select-none"
      onClick={handleCanvasClick}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* HUD (Active during gameplay) */}
      {gameStatus === 'PLAYING' && (
        <HUD
          player={playerState}
          boss={activeBoss}
          prompt={promptMessage}
          settings={settings}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenCatalog={() => setCatalogOpen(true)}
          onOpenShop={() => setShopOpen(true)}
          onToggleMute={handleToggleMute}
          onUseMedkit={() => engineRef.current?.useMedkit()}
          damageFlash={damageFlash}
        />
      )}

      {/* Mobile Virtual Touch Controls */}
      {gameStatus === 'PLAYING' && isTouchDevice && !catalogOpen && !shopOpen && !settingsOpen && (
        <MobileControls
          onMove={(m) => {
            if (engineRef.current) {
              engineRef.current.virtualJoystickMove = m;
            }
          }}
          onLook={(dy, dp) => {
            engineRef.current?.rotateCamera(dy, dp);
          }}
          onFire={(firing) => {
            engineRef.current?.triggerFire(firing);
          }}
          onAim={(aiming) => {
            engineRef.current?.triggerAim(aiming);
          }}
          onReload={() => {
            engineRef.current?.reloadWeapon();
          }}
          onJump={() => {
            if (engineRef.current && engineRef.current.player.isGrounded) {
              engineRef.current.playerVelocity.y = 5.0;
              engineRef.current.player.isGrounded = false;
            }
          }}
          onCrouch={() => {
            if (engineRef.current) {
              engineRef.current.player.isCrouching = !engineRef.current.player.isCrouching;
            }
          }}
          onSprint={(sprinting) => {
            if (engineRef.current) {
              engineRef.current.player.isSprinting = sprinting;
            }
          }}
          onFlashlight={() => {
            engineRef.current?.toggleFlashlight();
          }}
          onInteract={() => {
            engineRef.current?.interactWithWorld();
          }}
          onCycleWeapon={() => {
            engineRef.current?.cycleNextWeapon();
          }}
          sensitivity={settings.sensitivity}
        />
      )}

      {startupError && (
        <div role="alert" className="fixed inset-x-4 top-4 z-[100] rounded-xl border border-red-500/60 bg-black/95 p-4 text-sm text-red-200 shadow-2xl">
          <p className="font-bold">Unable to start the game</p>
          <p className="mt-1">{startupError}</p>
          <button className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-white" onClick={() => { setStartupError(null); handleStartGame(); }}>Try again</button>
        </div>
      )}

      {isEngineLoading && (
        <div role="status" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 font-mono-hud text-sm tracking-widest text-red-200">
          {settings.language === 'ar' ? 'جارٍ تحميل القطاع 4...' : 'LOADING SECTOR 4...'}
        </div>
      )}

      {/* Start Main Menu */}
      {gameStatus === 'MENU' && (
        <StartMenu
          settings={settings}
          onStartGame={handleStartGame}
          onOpenCatalog={() => setCatalogOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {/* Game Over Screen */}
      {gameStatus === 'GAMEOVER' && (
        <GameOverOverlay
          settings={settings}
          onRestart={handleRestart}
          onReturnMenu={handleReturnMenu}
        />
      )}

      {/* Victory Screen */}
      {gameStatus === 'VICTORY' && (
        <VictoryOverlay
          settings={settings}
          onContinue={handleRestart}
          onReturnMenu={handleReturnMenu}
        />
      )}

      {/* Monster Encyclopedia / Catalog Modal */}
      {catalogOpen && (
        <MonsterCatalogModal
          settings={settings}
          onClose={() => setCatalogOpen(false)}
          onToggleLanguage={handleToggleLanguage}
        />
      )}

      {/* Night Coins Shop Modal */}
      {shopOpen && (
        <ShopModal
          player={playerState}
          settings={settings}
          onClose={() => setShopOpen(false)}
          onBuy={(type, cost, payload) => {
            if (engineRef.current) {
              return engineRef.current.buyItem(type, cost, payload);
            }
            return false;
          }}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Landscape Orientation Enforcement Overlay for Mobile */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl text-center select-none">
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            {/* Animated phone rotating to landscape */}
            <div className="w-12 h-20 border-2 border-red-500 rounded-xl animate-spin [animation-duration:3.5s] flex items-center justify-center bg-black/60 shadow-[0_0_25px_rgba(239,68,68,0.5)]">
              <div className="w-2 h-2 rounded-full bg-red-400" />
            </div>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-red-500 tracking-wider mb-2">
            {settings.language === 'ar' ? 'يرجى تدوير جهازك إلى الوضع الأفقي' : 'ROTATE TO LANDSCAPE MODE'}
          </h2>
          <p className="text-xs sm:text-sm font-mono-hud text-slate-300 max-w-sm leading-relaxed mb-4">
            {settings.language === 'ar' 
              ? 'تتطلب لعبة SHADOWS: NIGHT TIDE الوضع الأفقي لتشغيل أدوات التحكم باللمس المزدوجة وتجربة الرعب ثلاثية الأبعاد الكاملة.' 
              : 'SHADOWS: NIGHT TIDE requires landscape orientation for dual-stick touch controls and complete 3D horror immersion.'}
          </p>
          <div className="px-4 py-1.5 bg-red-950/70 border border-red-600/40 rounded-full text-[11px] font-mono-hud text-red-300 animate-pulse">
            {settings.language === 'ar' ? 'أدر جهازك أفقياً للمتابعة فوراً' : 'Rotate your device horizontally to resume'}
          </div>
        </div>
      )}
    </div>
  );
}
