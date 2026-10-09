import React, { useState } from 'react';
import { GameSettings } from '../game/types';
import { MONSTER_DOSSIERS, STORY_BRIEFING } from '../game/dossierData';
import { 
  X, 
  FileText, 
  Skull, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  Volume2, 
  Crosshair, 
  Languages 
} from 'lucide-react';

interface MonsterCatalogModalProps {
  settings: GameSettings;
  onClose: () => void;
  onToggleLanguage: () => void;
}

export const MonsterCatalogModal: React.FC<MonsterCatalogModalProps> = ({
  settings,
  onClose,
  onToggleLanguage,
}) => {
  const isArabic = settings.language === 'ar';
  const [selectedId, setSelectedId] = useState<string>('boss_maryam');
  const [viewTab, setViewTab] = useState<'monsters' | 'briefing' | 'tactics'>('monsters');

  const selectedMonster = MONSTER_DOSSIERS.find((m) => m.id === selectedId) || MONSTER_DOSSIERS[0];
  const story = isArabic ? STORY_BRIEFING.ar : STORY_BRIEFING.en;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md ${isArabic ? 'direction-rtl' : ''}`}>
      <div className="relative w-full max-w-4xl bg-slate-950 border border-red-900/40 rounded-xl shadow-[0_0_40px_rgba(185,28,28,0.2)] flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950/60 border border-red-600/40 rounded-lg text-red-400">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg font-bold text-red-200 tracking-wide">
                {isArabic ? 'سجل الكائنات السرية — مد الظلال' : 'PROJECT NIGHT TIDE // MONSTER ENCYCLOPEDIA'}
              </h2>
              <span className="text-xs text-slate-400 font-mono-hud">
                {isArabic ? 'ملفات تصنيف العينات البيولوجية' : 'Classified Bio-Threat Specimen Dossiers'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle button */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-lg text-xs font-mono-hud text-slate-300 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Section Nav Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 px-6 pt-2">
          <button
            onClick={() => setViewTab('monsters')}
            className={`px-4 py-2 text-xs font-mono-hud font-semibold border-b-2 transition-colors ${
              viewTab === 'monsters' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'دليل الوحوش والأتباع' : 'SPECIMEN DOSSIERS'}
          </button>
          <button
            onClick={() => setViewTab('briefing')}
            className={`px-4 py-2 text-xs font-mono-hud font-semibold border-b-2 transition-colors ${
              viewTab === 'briefing' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'قصة الحادثة والبحث' : 'INCIDENT BRIEFING'}
          </button>
          <button
            onClick={() => setViewTab('tactics')}
            className={`px-4 py-2 text-xs font-mono-hud font-semibold border-b-2 transition-colors ${
              viewTab === 'tactics' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'إرشادات النجاة' : 'SURVIVAL PROTOCOLS'}
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewTab === 'monsters' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Sidebar List of Monsters */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono-hud text-slate-400 uppercase tracking-wider mb-2">
                  {isArabic ? 'الزعيمان الرئيسيان (الفئة قمة)' : 'APEX BOSS SPECIMENS'}
                </div>
                {MONSTER_DOSSIERS.slice(0, 2).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                      selectedId === m.id
                        ? 'bg-red-950/50 border-red-500 text-white shadow-md'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-cinzel text-xs font-bold text-red-300">
                        {isArabic ? m.nameAr : m.nameEn}
                      </span>
                      <span className="text-[9px] bg-red-900/60 text-red-200 px-1.5 py-0.5 rounded font-mono-hud">
                        {m.dangerRating}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate">
                      {isArabic ? m.classificationAr : m.classificationEn}
                    </span>
                  </button>
                ))}

                <div className="text-[11px] font-mono-hud text-slate-400 uppercase tracking-wider mt-4 mb-2">
                  {isArabic ? 'الأتباع والمتحولون' : 'FOLLOWER SUB-SPECIES'}
                </div>
                {MONSTER_DOSSIERS.slice(2).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                      selectedId === m.id
                        ? 'bg-slate-800/80 border-slate-400 text-white shadow-md'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-cinzel text-xs font-bold text-slate-200">
                        {isArabic ? m.nameAr : m.nameEn}
                      </span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono-hud">
                        {m.dangerRating}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate">
                      {isArabic ? m.classificationAr : m.classificationEn}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Detail Pane */}
              <div className="md:col-span-2 bg-black/60 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-red-300">
                      {isArabic ? selectedMonster.nameAr : selectedMonster.nameEn}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono-hud">
                      {isArabic ? selectedMonster.classificationAr : selectedMonster.classificationEn}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-red-950/70 border border-red-500/40 px-3 py-1 rounded text-red-300 font-mono-hud text-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>DANGER: {selectedMonster.dangerRating}</span>
                  </div>
                </div>

                {/* Silhouette & Visual Identity */}
                <div className="bg-slate-900/50 border border-white/5 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono-hud mb-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'المظهر والمطابقة البصرية:' : 'VISUAL RECOGNITION & SILHOUETTE:'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isArabic ? selectedMonster.silhouetteAr : selectedMonster.silhouetteEn}
                  </p>
                </div>

                {/* Scientific Lore */}
                <div>
                  <h4 className="text-xs text-slate-400 font-mono-hud uppercase mb-1">
                    {isArabic ? 'الخلفية العلمية والتحول' : 'BIOLOGICAL ORIGIN & PATHOLOGY'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded border border-white/5">
                    {isArabic ? selectedMonster.loreAr : selectedMonster.loreEn}
                  </p>
                </div>

                {/* Attack Style & Audio Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/40 p-3 rounded border border-white/5">
                    <span className="font-mono-hud text-slate-400 block mb-1">
                      {isArabic ? 'النمط الهجومي:' : 'ATTACK BEHAVIOR:'}
                    </span>
                    <p className="text-slate-300">
                      {isArabic ? selectedMonster.attackStyleAr : selectedMonster.attackStyleEn}
                    </p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded border border-white/5">
                    <span className="font-mono-hud text-slate-400 flex items-center gap-1 mb-1">
                      <Volume2 className="w-3 h-3 text-sky-400" />
                      {isArabic ? 'البصمة الصوتية:' : 'ACOUSTIC SIGNATURE:'}
                    </span>
                    <p className="text-slate-300">
                      {isArabic ? selectedMonster.soundIdentityAr : selectedMonster.soundIdentityEn}
                    </p>
                  </div>
                </div>

                {/* Weakness & Combat Tactics */}
                <div className="bg-red-950/30 border border-red-500/20 p-3 rounded-lg text-xs space-y-2">
                  <div>
                    <strong className="text-red-400 font-mono-hud block">
                      {isArabic ? 'نقطة الضعف القاتلة:' : 'CRITICAL WEAKNESS:'}
                    </strong>
                    <p className="text-slate-300">
                      {isArabic ? selectedMonster.weaknessAr : selectedMonster.weaknessEn}
                    </p>
                  </div>
                  <div>
                    <strong className="text-amber-400 font-mono-hud block">
                      {isArabic ? 'تكتيكات البقاء:' : 'SURVIVAL DIRECTIVE:'}
                    </strong>
                    <p className="text-slate-300">
                      {isArabic ? selectedMonster.tacticsAr : selectedMonster.tacticsEn}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BRIEFING TAB */}
          {viewTab === 'briefing' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="font-cinzel text-lg font-bold text-red-300">
                {story.title}
              </h3>
              <span className="text-xs text-slate-400 font-mono-hud block">
                {story.subtitle}
              </span>
              <div className="bg-black/60 border border-white/10 rounded-xl p-6 text-sm text-slate-300 leading-relaxed whitespace-pre-line font-serif">
                {story.content}
              </div>
            </div>
          )}

          {/* TACTICS TAB */}
          {viewTab === 'tactics' && (
            <div className="max-w-2xl mx-auto space-y-4 text-xs">
              <h3 className="font-cinzel text-base font-bold text-amber-300">
                {isArabic ? 'بروتوكولات النجاة والقتال الميداني' : 'FIELD OPERATIONAL GUIDELINES'}
              </h3>
              <div className="space-y-3">
                <div className="bg-black/40 border border-white/10 p-4 rounded-lg">
                  <h4 className="font-mono-hud font-bold text-slate-200 mb-1">
                    {isArabic ? '1. إدارة الضوء والبطارية' : '1. FLASHLIGHT & STEALTH DISCIPLINE'}
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    {isArabic 
                      ? 'مريم وسارة يمتلكان حساسية فائقة للضوء المباشر. في الممرات الطويلة، أطفئ المصباح [F] لتجنب رصدك من مسافات بعيدة. لكن في المواجهات المباشرة، تسليط الضوء على سارة يعيق حركتها مؤقتاً.'
                      : 'Maryam and Sarah possess high sensitivity to direct illumination. In open corridors, toggle flashlight [F] off to reduce visual detection distance. However, in direct ambush with Sarah, high-beam light briefly disrupts her stalk.'
                    }
                  </p>
                </div>

                <div className="bg-black/40 border border-white/10 p-4 rounded-lg">
                  <h4 className="font-mono-hud font-bold text-slate-200 mb-1">
                    {isArabic ? '2. الضوضاء وتتبع الموقع الأخير' : '2. NOISE & LAST KNOWN POSITION (LKP)'}
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    {isArabic 
                      ? 'الجري وإطلاق النار يصدران صوتاً يصل لمسافة 25 متراً. إذا انقطع خط الرؤية مع الوحش، فإنه سيتوجه فوراً إلى آخر موقع رأى فيه اللاعب. استغل هذه اللحظة للالتفاف خلفه.'
                      : 'Sprinting and unsuppressed gunfire generate acoustic shockwaves up to 25 meters. When breaking line of sight, monsters advance to your Last Known Position (LKP). Use this window to flank or hide.'
                    }
                  </p>
                </div>

                <div className="bg-black/40 border border-white/10 p-4 rounded-lg">
                  <h4 className="font-mono-hud font-bold text-slate-200 mb-1">
                    {isArabic ? '3. ترسانة الأسلحة المتكاملة' : '3. WEAPON ARSENAL DISCIPLINE'}
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    {isArabic 
                      ? 'لا تهدر طلقات الشوزن والمدفع الثقيل على الزواحف الصغيرة؛ استخدم المسدس والصاعق الكهربائي. احتفظ بأسلحة الطاقة والمقذوفات الثقيلة لمواجهة مريم وسارة في الغرف المحصنة.'
                      : 'Never squander shotgun buckshot or demolition rounds on small crawlers; neutralize them with sidearms or shock prods. Reserve heavy explosive and coherent laser weapons for boss confrontations.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono-hud text-xs rounded-lg transition-colors"
          >
            {isArabic ? 'العودة للعبة' : 'RETURN TO SIMULATION'}
          </button>
        </div>
      </div>
    </div>
  );
};
