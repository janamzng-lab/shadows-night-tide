import React from 'react';
import { PlayerState, GameSettings } from '../game/types';
import { 
  Heart, 
  Zap, 
  Battery, 
  Coins, 
  Crosshair, 
  Settings, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  ShieldAlert,
  ShoppingBag,
  Eye,
  Skull,
  Moon
} from 'lucide-react';

interface HUDProps {
  player: PlayerState;
  boss: { name: string; health: number; maxHealth: number } | null;
  prompt: string | null;
  settings: GameSettings;
  onOpenSettings: () => void;
  onOpenCatalog: () => void;
  onOpenShop: () => void;
  onToggleMute: () => void;
  onUseMedkit: () => void;
  damageFlash: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  boss,
  prompt,
  settings,
  onOpenSettings,
  onOpenCatalog,
  onOpenShop,
  onToggleMute,
  onUseMedkit,
  damageFlash,
}) => {
  const currentWeapon = player.weapons[player.currentWeaponId];
  const isArabic = settings.language === 'ar';
  const healthPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100));
  const batteryPercent = Math.max(0, Math.min(100, (player.battery / player.maxBattery) * 100));
  const fear = player.fear ?? 0;
  const maxFear = player.maxFear || 100;
  const fearPercent = Math.max(0, Math.min(100, (fear / maxFear) * 100));
  const isCriticalFear = fearPercent >= 70;
  const isPanicFear = fearPercent >= 85;

  return (
    <div className={`pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-4 ${isArabic ? 'direction-rtl' : ''}`}>
      {/* Damage / Horror Vignette Effects */}
      <div className="vignette-overlay absolute inset-0" />
      {healthPercent < 35 && <div className="blood-vignette absolute inset-0 animate-pulse" />}
      {damageFlash && <div className="absolute inset-0 bg-red-700/40 transition-opacity duration-150" />}
      <div className="crt-scanlines absolute inset-0 opacity-40" />

      {/* Critical Fear Visual Effects: Dynamic Blur & Psychosis Tunnel Vision */}
      {fearPercent >= 65 && (
        <div 
          className={`pointer-events-none absolute inset-0 z-10 transition-all duration-300 ${isPanicFear ? 'animate-panic-shake' : ''}`}
          style={{
            backdropFilter: `blur(${Math.min(5.5, ((fearPercent - 60) / 40) * 5.2)}px)`,
            WebkitBackdropFilter: `blur(${Math.min(5.5, ((fearPercent - 60) / 40) * 5.2)}px)`,
          }}
        />
      )}
      {fearPercent >= 60 && (
        <div 
          className="fear-critical-vignette absolute inset-0 z-10 transition-opacity duration-300 animate-fear-pulse pointer-events-none"
          style={{
            opacity: Math.min(1.0, (fearPercent - 55) / 45),
          }}
        />
      )}

      {/* Critical Fear Senses Alert Banner */}
      {fearPercent >= 75 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-purple-950/90 border border-purple-500/70 shadow-[0_0_25px_rgba(192,38,211,0.7)] text-purple-200 text-xs font-mono-hud font-bold uppercase tracking-wider animate-glitch pointer-events-none">
          <Eye className="w-4 h-4 text-purple-400 animate-ping" />
          <span>
            {isArabic 
              ? '⚠️ ذعر حرج: الرؤية مشوشة — ابحث عن الضوء!' 
              : '⚠️ CRITICAL FEAR: SENSES DISTORTED — SEEK LIGHT!'}
          </span>
        </div>
      )}

      {/* TOP BAR: Objective & Quick System Actions */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        {/* Left: Active Objective & Status */}
        <div className="flex flex-col gap-1 max-w-md">
          <div className="flex items-center gap-2 text-xs font-mono-hud text-red-400 uppercase tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{isArabic ? 'المهمة النشطة' : 'ACTIVE OBJECTIVE'}</span>
          </div>
          <p className="text-sm font-medium text-slate-200 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 shadow-lg">
            {isArabic ? player.objectiveAr : player.objective}
          </p>
        </div>

        {/* Center: Boss Health Bar (When Boss Engaged!) */}
        {boss && (
          <div className="flex-1 max-w-lg mx-auto flex flex-col items-center animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="font-cinzel text-sm font-bold tracking-widest text-red-300 drop-shadow">
                {boss.name.toUpperCase()}
              </span>
            </div>
            <div className="w-full h-3 bg-black/80 border border-red-500/50 rounded-full overflow-hidden p-0.5 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <div 
                className="h-full bg-gradient-to-r from-red-800 via-red-600 to-red-500 rounded-full transition-all duration-200"
                style={{ width: `${Math.max(0, (boss.health / boss.maxHealth) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono-hud text-red-400/80 mt-0.5">
              {boss.health} / {boss.maxHealth} HP
            </span>
          </div>
        )}

        {/* Right: Currency & Menu Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Night Coins counter */}
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-amber-500/30 px-3 py-1.5 rounded text-amber-300 text-xs font-mono-hud shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">{player.coins}</span>
          </div>

          {/* Shop button */}
          <button 
            onClick={onOpenShop}
            title={isArabic ? 'متجر العملات' : 'Night Coins Shop'}
            className="p-2 bg-black/70 hover:bg-slate-800/80 text-amber-400 rounded border border-amber-500/30 transition-colors shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          {/* Monster Catalog button */}
          <button 
            onClick={onOpenCatalog}
            title={isArabic ? 'دليل الوحوش' : 'Monster Dossier'}
            className="p-2 bg-black/70 hover:bg-slate-800/80 text-slate-300 rounded border border-white/10 transition-colors shadow-md"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Mute button */}
          <button 
            onClick={onToggleMute}
            title={settings.muted ? 'Unmute' : 'Mute'}
            className="p-2 bg-black/70 hover:bg-slate-800/80 text-slate-300 rounded border border-white/10 transition-colors shadow-md"
          >
            {settings.muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings button */}
          <button 
            onClick={onOpenSettings}
            title={isArabic ? 'الإعدادات' : 'Settings'}
            className="p-2 bg-black/70 hover:bg-slate-800/80 text-slate-300 rounded border border-white/10 transition-colors shadow-md"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER: Crosshair & Interaction Prompt */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <Crosshair className="w-6 h-6 text-white/50 drop-shadow" />

        {prompt && (
          <div className="mt-4 bg-black/85 backdrop-blur-md px-4 py-1.5 rounded border border-amber-500/40 text-amber-300 text-xs font-mono-hud shadow-xl animate-bounce">
            {prompt}
          </div>
        )}
      </div>

      {/* BOTTOM BAR: Health, Fear, Stamina, Battery, Weapon & Ammo */}
      <div className="relative z-10 flex items-end justify-between gap-4">
        {/* Left: Vitals (Health, Fear, Stamina, Battery) */}
        <div className="flex flex-col gap-2.5 bg-black/80 backdrop-blur-md p-3.5 rounded-lg border border-white/10 w-72 shadow-xl">
          {/* Health Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono-hud text-slate-300">
              <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                {isArabic ? 'الصحة' : 'HEALTH'}
              </span>
              <span>{Math.round(player.health)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  healthPercent > 50 ? 'bg-red-600' : healthPercent > 25 ? 'bg-amber-600' : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>

          {/* Fear Meter Bar */}
          <div className="space-y-1 pt-1.5 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-mono-hud">
              <span className="flex items-center gap-1.5 font-semibold text-purple-400">
                <Eye className={`w-3.5 h-3.5 ${isCriticalFear ? 'text-purple-300 animate-pulse' : 'text-purple-400'}`} />
                <span>{isArabic ? 'مقياس الرعب' : 'FEAR METER'}</span>
              </span>
              
              <div className="flex items-center gap-1.5">
                {/* Cause badge */}
                {player.fearCause === 'darkness' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 flex items-center gap-0.5">
                    <Moon className="w-2.5 h-2.5" />
                    {isArabic ? 'ظلام' : 'DARK'}
                  </span>
                )}
                {player.fearCause === 'monster' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center gap-0.5 animate-pulse">
                    <Skull className="w-2.5 h-2.5" />
                    {isArabic ? 'تهديد' : 'NEAR'}
                  </span>
                )}
                {player.fearCause === 'critical' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/90 text-purple-200 border border-purple-500/60 font-bold animate-pulse">
                    {isArabic ? 'ذعر' : 'PANIC'}
                  </span>
                )}
                <span className={`font-bold tabular-nums ${isCriticalFear ? 'text-purple-300' : fearPercent >= 45 ? 'text-purple-400' : 'text-slate-400'}`}>
                  {Math.round(fearPercent)}%
                </span>
              </div>
            </div>

            {/* Fear Bar Trough */}
            <div className={`w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5 transition-all ${
              isCriticalFear ? 'fear-bar-critical-glow border-purple-500/60' : ''
            }`}>
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  fearPercent >= 75 
                    ? 'bg-gradient-to-r from-purple-800 via-fuchsia-600 to-rose-500 animate-pulse' 
                    : fearPercent >= 40 
                    ? 'bg-gradient-to-r from-indigo-800 via-purple-600 to-purple-500' 
                    : 'bg-gradient-to-r from-slate-700 via-indigo-700 to-purple-800'
                }`}
                style={{ width: `${fearPercent}%` }}
              />
            </div>

            {/* Fear State subtitle */}
            <div className="flex justify-between items-center text-[10px] font-mono-hud text-slate-400">
              <span className="text-slate-400">
                {fearPercent < 35 
                  ? (isArabic ? 'الحالة: هادئ' : 'Mind: Stable') 
                  : fearPercent < 70 
                  ? (isArabic ? 'الحالة: قلق' : 'Mind: Shaken') 
                  : (isArabic ? 'الحالة: انهيار حسي' : 'Mind: Psychosis')}
              </span>
              {isCriticalFear && (
                <span className="text-purple-400 animate-pulse font-semibold">
                  {isArabic ? 'تشوش الرؤية نشط' : 'VISION BLURRED'}
                </span>
              )}
            </div>
          </div>

          {/* Stamina & Battery Row */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
            {/* Stamina */}
            <div>
              <div className="flex justify-between text-[11px] font-mono-hud text-slate-400">
                <span className="flex items-center gap-0.5 text-blue-400">
                  <Zap className="w-3 h-3 text-blue-400" />
                  {isArabic ? 'التحمل' : 'STA'}
                </span>
                <span>{Math.round(staminaPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-0.5">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${staminaPercent}%` }}
                />
              </div>
            </div>

            {/* Battery */}
            <div>
              <div className="flex justify-between text-[11px] font-mono-hud text-slate-400">
                <span className="flex items-center gap-0.5 text-amber-400">
                  <Battery className="w-3 h-3 text-amber-400" />
                  {isArabic ? 'البطارية' : 'BAT'}
                </span>
                <span>{Math.round(batteryPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-0.5">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${batteryPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Medkit Quick Use button */}
          <div className="pointer-events-auto flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono-hud">
            <span className="text-slate-400">
              {isArabic ? 'حقائب الإسعاف:' : 'Medkits:'} <strong className="text-white">{player.inventory.medkits}</strong>
            </span>
            {player.inventory.medkits > 0 && (player.health < 100 || fearPercent > 25) && (
              <button 
                onClick={onUseMedkit}
                className="px-2 py-0.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 rounded transition-colors text-[10px]"
              >
                {isArabic ? 'استخدام (H)' : 'USE [H]'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Weapon Display & Ammo Counter */}
        <div className="flex flex-col items-end gap-1 bg-black/75 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-xl min-w-[180px]">
          <span className="text-xs font-semibold text-slate-300 font-cinzel tracking-wider">
            {isArabic ? currentWeapon.nameAr : currentWeapon.name}
          </span>
          <div className="flex items-baseline gap-1 text-slate-100 font-mono-hud">
            <span className="text-3xl font-bold tracking-tight text-white">
              {currentWeapon.currentClip}
            </span>
            <span className="text-sm text-slate-400">
              / {currentWeapon.reserveAmmo}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono-hud flex items-center gap-2">
            <span>[R] {isArabic ? 'تلقيم' : 'RELOAD'}</span>
            <span>·</span>
            <span>[1-9] {isArabic ? 'تبديل' : 'SWITCH'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
