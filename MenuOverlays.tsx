import React from 'react';
import { GameSettings } from '../game/types';
import { 
  Play, 
  RotateCcw, 
  BookOpen, 
  Settings, 
  Skull, 
  Award, 
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface StartMenuProps {
  settings: GameSettings;
  onStartGame: () => void;
  onOpenCatalog: () => void;
  onOpenSettings: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  settings,
  onStartGame,
  onOpenCatalog,
  onOpenSettings,
}) => {
  const isArabic = settings.language === 'ar';

  return (
    <div className={`fixed inset-0 z-40 flex flex-col justify-between p-8 bg-black/90 ${isArabic ? 'direction-rtl' : ''}`}>
      {/* Background Horror Ambience Vignette */}
      <div className="vignette-overlay absolute inset-0" />
      <div className="crt-scanlines absolute inset-0 opacity-50" />

      {/* Top Bar Header */}
      <div className="relative z-10 flex items-center justify-between text-xs font-mono-hud text-slate-400">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span>{isArabic ? 'القطاع 4 // منشأة الأعماق' : 'SECTOR 4 // SUB-LEVEL FACILITY'}</span>
        </span>
        <span>INDIE 3D SURVIVAL HORROR</span>
      </div>

      {/* Center Branding & Title */}
      <div className="relative z-10 max-w-xl mx-auto text-center space-y-4 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-500/30 rounded-full text-red-300 text-xs font-mono-hud mb-2">
          <Skull className="w-3.5 h-3.5" />
          <span>{isArabic ? 'تحديث: مقياس الرعب والتشوش البصري' : 'FEAR METER & CRITICAL DISTORTION SYSTEM'}</span>
        </div>

        <h1 className="font-cinzel text-4xl sm:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-red-600 drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]">
          SHADOWS:
          <span className="block text-3xl sm:text-5xl text-red-500 tracking-wider mt-1">
            NIGHT TIDE
          </span>
        </h1>

        <p className="text-sm text-slate-400 font-sans max-w-md mx-auto leading-relaxed">
          {isArabic 
            ? 'لعبة رعب وبقاء ثلاثية الأبعاد حقيقية. مواجهة حية مع الكيانين مريم وسارة، تنقل وذكاء اصطناعي للوحوش، وترسانة أسلحة متكاملة.'
            : 'Playable 3D survival horror. Confront the white horror Maryam and the sunken entity Sarah in the dark corridors of Sector 4.'
          }
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-3 pt-6 max-w-xs mx-auto">
          <button
            onClick={onStartGame}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-cinzel font-bold text-sm rounded-lg transition-all shadow-[0_0_25px_rgba(220,38,38,0.6)] active:scale-98"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{isArabic ? 'بدء الحملة (القطاع 4)' : 'START CAMPAIGN'}</span>
          </button>

          <button
            onClick={onOpenCatalog}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 font-mono-hud text-xs rounded-lg transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>{isArabic ? 'دليل الوحوش السرية' : 'MONSTER ENCYCLOPEDIA'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 font-mono-hud text-xs rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>{isArabic ? 'الإعدادات' : 'SETTINGS'}</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono-hud text-slate-500 border-t border-white/5 pt-4">
        <span>WASD / TOUCH CONTROLS · REAL 3D WEBGL</span>
        <span>COIN &amp; WEAPON SAVES ENABLED</span>
      </div>
    </div>
  );
};

interface GameOverOverlayProps {
  settings: GameSettings;
  onRestart: () => void;
  onReturnMenu: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  settings,
  onRestart,
  onReturnMenu,
}) => {
  const isArabic = settings.language === 'ar';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md ${isArabic ? 'direction-rtl' : ''}`}>
      <div className="blood-vignette absolute inset-0 animate-pulse" />
      <div className="relative z-10 max-w-md w-full text-center space-y-5 bg-slate-950/80 border border-red-900/60 p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.4)]">
        <div className="p-3 bg-red-950/70 border border-red-600/50 rounded-full w-14 h-14 mx-auto flex items-center justify-center text-red-500">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="font-cinzel text-3xl font-black text-red-500 tracking-wider">
          {isArabic ? 'تم القضاء عليك' : 'YOU DIED'}
        </h2>

        <p className="text-xs font-mono-hud text-red-300/80 uppercase tracking-widest">
          {isArabic ? 'استهلكك مد الظلال في القطاع 4' : 'CONSUMED BY THE NIGHT TIDE'}
        </p>

        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          {isArabic
            ? 'الأحشاء والمخالب لم تترك لك مهرباً. تذكر: استخدم الأعمدة لقطع خط الرؤية وأطلق النار على نقاط الضعف.'
            : 'Your vitals collapsed. Remember: break line of sight around corridors to force enemies into search state.'
          }
        </p>

        <div className="flex flex-col gap-2 pt-4">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-800 hover:bg-red-700 text-white font-cinzel font-bold text-xs rounded-lg transition-colors shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isArabic ? 'إعادة المحاولة من نقطة التفتيش' : 'RESTART FROM CHECKPOINT'}</span>
          </button>

          <button
            onClick={onReturnMenu}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-mono-hud text-xs rounded-lg transition-colors border border-white/10"
          >
            {isArabic ? 'القائمة الرئيسية' : 'MAIN MENU'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryOverlayProps {
  settings: GameSettings;
  onContinue: () => void;
  onReturnMenu: () => void;
}

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  settings,
  onContinue,
  onReturnMenu,
}) => {
  const isArabic = settings.language === 'ar';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md ${isArabic ? 'direction-rtl' : ''}`}>
      <div className="relative z-10 max-w-md w-full text-center space-y-5 bg-slate-950/80 border border-amber-500/40 p-8 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)]">
        <div className="p-3 bg-amber-950/70 border border-amber-500/50 rounded-full w-14 h-14 mx-auto flex items-center justify-center text-amber-400">
          <Award className="w-8 h-8" />
        </div>

        <h2 className="font-cinzel text-3xl font-black text-amber-300 tracking-wider">
          {isArabic ? 'تم تطهير القطاع 4!' : 'SECTOR 4 PURGED'}
        </h2>

        <p className="text-xs font-mono-hud text-amber-400 uppercase tracking-widest">
          {isArabic ? 'تمت هزيمة مريم وإغلاق الحجر الصحي' : 'MARYAM NEUTRALIZED // QUARANTINE SEALED'}
        </p>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {isArabic
            ? 'نجحت في النجاة من هجمات الرعب الأبيض وتأمين مفاتيح الحجر الصحي. لكن همسات سارة ما زالت تتردد في الممرات المغمورة بالأسفل...'
            : 'You survived the ferocious onslaught of the White Horror and sealed the containment gates. Yet Sarah’s clicks still echo from the flooded channels below...'
          }
        </p>

        <div className="flex flex-col gap-2 pt-4">
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs rounded-lg transition-colors shadow-lg"
          >
            <span>{isArabic ? 'التقدم إلى الفصل التالي' : 'PROCEED TO NEXT CHAPTER'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onReturnMenu}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-mono-hud text-xs rounded-lg transition-colors border border-white/10"
          >
            {isArabic ? 'القائمة الرئيسية' : 'MAIN MENU'}
          </button>
        </div>
      </div>
    </div>
  );
};
