import React from 'react';
import { GameSettings } from '../game/types';
import { 
  X, 
  Volume2, 
  Monitor, 
  Sliders, 
  EyeOff, 
  Languages,
  Sparkles
} from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onUpdateSettings,
}) => {
  const isArabic = settings.language === 'ar';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md ${isArabic ? 'direction-rtl' : ''}`}>
      <div className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <h2 className="font-cinzel text-lg font-bold text-slate-100 tracking-wide">
            {isArabic ? 'إعدادات اللعبة والنظام' : 'SYSTEM & AUDIO SETTINGS'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Audio Section */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-mono-hud text-slate-400 uppercase tracking-wider">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>{isArabic ? 'مستوى الصوت' : 'AUDIO VOLUMES'}</span>
            </h3>

            {/* Master Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono-hud text-slate-300">
                <span>{isArabic ? 'الصوت العام' : 'Master Volume'}</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono-hud text-slate-300">
                <span>{isArabic ? 'المؤثرات الصوتية (الأسلحة والوحوش)' : 'Sound Effects (Weapons & Monsters)'}</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Ambience Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono-hud text-slate-300">
                <span>{isArabic ? 'صوت بيئة الرعب المحيطة' : 'Horror Ambient Drone'}</span>
                <span>{Math.round(settings.ambienceVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={settings.ambienceVolume}
                onChange={(e) => onUpdateSettings({ ambienceVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Controls & Sensitivity */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-mono-hud text-slate-400 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>{isArabic ? 'حساسية التحكم والكاميرا' : 'LOOK SENSITIVITY'}</span>
            </h3>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono-hud text-slate-300">
                <span>{isArabic ? 'حساسية الماوس واللمس' : 'Camera Sensitivity'}</span>
                <span>{settings.sensitivity}</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="5"
                value={settings.sensitivity}
                onChange={(e) => onUpdateSettings({ sensitivity: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Graphics Quality */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-mono-hud text-slate-400 uppercase tracking-wider">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <span>{isArabic ? 'جودة الرسوميات' : 'GRAPHICS QUALITY'}</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`py-2 text-xs font-mono-hud uppercase rounded-lg border transition-colors ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Language & Accessibility */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-hud text-slate-300 flex items-center gap-2">
                <Languages className="w-4 h-4 text-indigo-400" />
                {isArabic ? 'اللغة / Language' : 'Language / اللغة'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateSettings({ language: 'en' })}
                  className={`px-3 py-1 text-xs font-mono-hud rounded border ${
                    settings.language === 'en' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-black/40 border-white/10 text-slate-400'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => onUpdateSettings({ language: 'ar' })}
                  className={`px-3 py-1 text-xs font-mono-hud rounded border ${
                    settings.language === 'ar' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-black/40 border-white/10 text-slate-400'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Reduced Flashing */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-mono-hud text-slate-300 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-purple-400" />
                {isArabic ? 'تقليل الوميض المفاجئ' : 'Reduce Sudden Flash Effects'}
              </span>
              <input 
                type="checkbox"
                checked={settings.reducedFlashing}
                onChange={(e) => onUpdateSettings({ reducedFlashing: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Night Tide Horror Shader FX (Film Grain & Chromatic Aberration) */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-mono-hud text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {isArabic ? 'جو الرعب (حبيبات الفيلم والزيغ اللوني)' : 'Horror Atmosphere (Film-Grain & Aberration)'}
              </span>
              <input 
                type="checkbox"
                checked={settings.filmGrainEnabled !== false}
                onChange={(e) => onUpdateSettings({ filmGrainEnabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono-hud text-xs rounded-lg transition-colors"
          >
            {isArabic ? 'حفظ وإغلاق' : 'SAVE & CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
};
