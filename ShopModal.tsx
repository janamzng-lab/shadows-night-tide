import React, { useState } from 'react';
import { PlayerState, GameSettings, WeaponId } from '../game/types';
import { 
  X, 
  Coins, 
  Crosshair, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  ArrowUpCircle,
  Zap
} from 'lucide-react';

interface ShopModalProps {
  player: PlayerState;
  settings: GameSettings;
  onClose: () => void;
  onBuy: (type: string, cost: number, payload?: { weaponId?: WeaponId }) => boolean;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  player,
  settings,
  onClose,
  onBuy,
}) => {
  const isArabic = settings.language === 'ar';
  const [activeTab, setActiveTab] = useState<'ammo' | 'weapons' | 'upgrades'>('weapons');
  const [message, setMessage] = useState<string | null>(null);

  const handlePurchase = (type: string, cost: number, payload?: { weaponId?: WeaponId }) => {
    const success = onBuy(type, cost, payload);
    if (success) {
      setMessage(isArabic ? 'تمت العملية بنجاح!' : 'Purchase Successful!');
    } else {
      setMessage(isArabic ? 'عملات غير كافية أو العنصر غير متاح!' : 'Not enough coins or item unavailable!');
    }
    setTimeout(() => setMessage(null), 2500);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md ${isArabic ? 'direction-rtl' : ''}`}>
      <div className="relative w-full max-w-2xl bg-slate-950 border border-amber-500/30 rounded-xl shadow-[0_0_35px_rgba(245,158,11,0.15)] flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/50 border border-amber-500/40 rounded-lg text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg font-bold text-amber-200 tracking-wide">
                {isArabic ? 'محطة إمدادات مد الظلال' : 'NIGHT TIDE SUPPLY TERMINAL'}
              </h2>
              <span className="text-xs text-slate-400 font-mono-hud">
                {isArabic ? 'المخزن الآمن — القطاع 4' : 'Sector 4 Safe Quarantine Cache'}
              </span>
            </div>
          </div>

          {/* Balance & Close button */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/40 px-3 py-1.5 rounded-lg text-amber-300 font-mono-hud text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold">{player.coins}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Message toast */}
        {message && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 text-amber-300 text-xs text-center py-2 font-mono-hud">
            {message}
          </div>
        )}

        {/* Tab Filter Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 px-6 pt-2">
          <button
            onClick={() => setActiveTab('weapons')}
            className={`px-4 py-2 text-xs font-mono-hud font-semibold border-b-2 transition-colors ${
              activeTab === 'weapons' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'الأسلحة' : 'WEAPONS ARSENAL'}
          </button>
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`px-4 py-2 text-xs font-mono-hud font-semibold border-b-2 transition-colors ${
              activeTab === 'upgrades' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'ترقيات الضرر' : 'DAMAGE UPGRADES'}
          </button>
          <button
            onClick={() => setActiveTab('ammo')}
            className={`px-4 py-2 text-xs font-mono-hud font-semibold border-b-2 transition-colors ${
              activeTab === 'ammo' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'الذخائر والإسعاف' : 'AMMO & MEDICAL'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* WEAPONS TAB */}
          {activeTab === 'weapons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(player.weapons).map((w) => (
                <div 
                  key={w.id} 
                  className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col justify-between hover:border-white/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cinzel text-sm font-bold text-slate-100">
                        {isArabic ? w.nameAr : w.name}
                      </span>
                      {w.category === 'special' && (
                        <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-600/40 px-1.5 py-0.5 rounded font-mono-hud">
                          SPECIAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{w.description}</p>
                    <div className="flex items-center gap-3 text-xs font-mono-hud text-slate-300 mb-4">
                      <span>DMG: <strong className="text-white">{w.damage}</strong></span>
                      <span>CAP: <strong className="text-white">{w.clipSize}</strong></span>
                      <span>RATE: <strong className="text-white">{w.fireRate}/s</strong></span>
                    </div>
                  </div>

                  {w.isUnlocked ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono-hud bg-emerald-950/30 border border-emerald-500/20 px-3 py-1.5 rounded">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isArabic ? 'ممتلك' : 'OWNED'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase('unlock_weapon', w.cost, { weaponId: w.id })}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono-hud font-bold text-xs rounded transition-colors shadow-md"
                    >
                      <Coins className="w-4 h-4" />
                      <span>{isArabic ? `فتح مقابل ${w.cost}` : `UNLOCK (${w.cost} COINS)`}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* UPGRADES TAB */}
          {activeTab === 'upgrades' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(player.weapons).filter((w) => w.isUnlocked).map((w) => (
                <div key={w.id} className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-cinzel text-sm font-bold text-slate-100 mb-1">
                      {isArabic ? w.nameAr : w.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-slate-400 font-mono-hud">
                        {isArabic ? 'مستوى الترقية:' : 'Upgrade Tier:'}
                      </span>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((tier) => (
                          <div 
                            key={tier}
                            className={`w-4 h-2 rounded-sm ${
                              w.upgradeTier >= tier ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      {isArabic ? 'يزيد من القوة التدميرية للسلاح بنسبة +25%.' : 'Increases weapon stopping power by +25% per tier.'}
                    </p>
                  </div>

                  {w.upgradeTier >= 2 ? (
                    <span className="text-xs text-amber-400 font-mono-hud text-center py-2 bg-amber-950/20 border border-amber-500/20 rounded">
                      MAX TIER REACHED
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePurchase('upgrade_damage', 300 * (w.upgradeTier + 1), { weaponId: w.id })}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-mono-hud text-xs rounded transition-colors"
                    >
                      <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                      <span>{isArabic ? `ترقية (${300 * (w.upgradeTier + 1)} عملة)` : `UPGRADE TIER (${300 * (w.upgradeTier + 1)} COINS)`}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AMMO & MEDICAL TAB */}
          {activeTab === 'ammo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pistol Ammo */}
              <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-slate-100 mb-1">
                    {isArabic ? 'ذخيرة مسدس 9 ملم (24 طلقة)' : '9mm Pistol Rounds (24x)'}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {isArabic ? 'خراطيش قياسية عالية الدقة.' : 'Standard sidearm cartridges.'}
                  </p>
                </div>
                <button
                  onClick={() => handlePurchase('ammo_pistol', 80)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-mono-hud text-xs rounded transition-colors"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{isArabic ? 'شراء (80 عملة)' : 'BUY (80 COINS)'}</span>
                </button>
              </div>

              {/* Shotgun Ammo */}
              <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-slate-100 mb-1">
                    {isArabic ? 'خراطيش شوزن 12 ملم (12 طلقة)' : '12-Gauge Buckshot (12x)'}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {isArabic ? 'طلقات ثقيلة للمسافات القريبة.' : 'Heavy scatter rounds for close-range knockback.'}
                  </p>
                </div>
                <button
                  onClick={() => handlePurchase('ammo_shotgun', 120)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-mono-hud text-xs rounded transition-colors"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{isArabic ? 'شراء (120 عملة)' : 'BUY (120 COINS)'}</span>
                </button>
              </div>

              {/* Rifle Ammo */}
              <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-slate-100 mb-1">
                    {isArabic ? 'خزنة بندقية AR-4 (60 طلقة)' : '5.56mm Rifle Mag (60x)'}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {isArabic ? 'ذخيرة عسكرية سريعة الطلقات.' : 'High velocity military rifle ammunition.'}
                  </p>
                </div>
                <button
                  onClick={() => handlePurchase('ammo_rifle', 150)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-mono-hud text-xs rounded transition-colors"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{isArabic ? 'شراء (150 عملة)' : 'BUY (150 COINS)'}</span>
                </button>
              </div>

              {/* Medical Kit */}
              <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-slate-100 mb-1">
                    {isArabic ? 'حقيبة إسعافات أولية (+45 HP)' : 'Trauma First Aid Kit (+45 HP)'}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {isArabic ? 'تستعيد 45 نقطة صحة وتوقف النزيف.' : 'Restores 45 health and stabilizes trauma shock.'}
                  </p>
                </div>
                <button
                  onClick={() => handlePurchase('medkit', 100)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 font-mono-hud text-xs rounded transition-colors"
                >
                  <Heart className="w-4 h-4 text-red-400" />
                  <span>{isArabic ? 'شراء (100 عملة)' : 'BUY (100 COINS)'}</span>
                </button>
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
            {isArabic ? 'إغلاق المحطة' : 'CLOSE TERMINAL'}
          </button>
        </div>
      </div>
    </div>
  );
};
