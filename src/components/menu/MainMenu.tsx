import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Shield, 
  Zap, 
  Users, 
  Coins, 
  ShoppingCart, 
  ChevronLeft, 
  Swords, 
  Award, 
  Skull 
} from 'lucide-react';
import { 
  WeaponType, 
  DifficultyKey, 
  WEAPONS, 
  DIFFICULTIES 
} from '../../game/constants';
import { LifetimeStats, WeaponUpgradeLevels } from '../../game/types';
import { saveDifficulty } from '../../game/persistence';
import { sounds } from '../../game/SoundEngine';

interface MainMenuProps {
  initGame: () => void;
  setGameState: (state: 'start' | 'playing' | 'dead' | 'win' | 'upgrades') => void;
  menuView: 'main' | 'armory' | 'difficulty' | 'profile';
  setMenuView: (view: 'main' | 'armory' | 'difficulty' | 'profile') => void;
  difficulty: DifficultyKey;
  setDifficulty: (difficulty: DifficultyKey) => void;
  tacticalCredits: number;
  lifetimeStats: LifetimeStats;
  weaponUpgradeLevels: WeaponUpgradeLevels;
  setUpgradeTab: (tab: 'biological' | 'weapon') => void;
  setSelectedLabWeapon: (weapon: WeaponType) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  initGame,
  setGameState,
  menuView,
  setMenuView,
  difficulty,
  setDifficulty,
  tacticalCredits,
  lifetimeStats,
  weaponUpgradeLevels,
  setUpgradeTab,
  setSelectedLabWeapon
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <AnimatePresence mode="wait">
        {menuView === 'main' && (
          <motion.div 
            key="main"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center z-10"
          >
            <motion.div 
              initial={{ y: -50 }} animate={{ y: 0 }}
              className="w-24 h-24 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 border-2 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]"
            >
              <Zap className="text-yellow-500" size={48} />
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mb-1 uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] text-center">Nano Banana</h1>
            <div className="flex items-center gap-3 mb-10 text-yellow-500 font-bold tracking-[0.4em] uppercase text-xs">
              <div className="h-px w-8 bg-yellow-500/50" />
              3D Tactical Simulator
              <div className="h-px w-8 bg-yellow-500/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
              <button 
                onClick={initGame}
                className="bg-white text-slate-950 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-yellow-500 hover:scale-105 transition-all shadow-xl group border-b-4 border-slate-300 active:translate-y-1 active:border-b-0"
              >
                <Target size={32} className="mb-2" />
                <span className="font-black text-xl uppercase tracking-tighter italic">Start Mission</span>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Active Sector: 01</span>
              </button>

              <button 
                onClick={() => setGameState('upgrades')}
                className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-800 hover:scale-105 transition-all shadow-xl text-white group"
              >
                <ShoppingCart size={32} className="text-yellow-500 mb-2" />
                <span className="font-black text-xl uppercase tracking-tighter italic">Command Center</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Upgrades & Tech</span>
              </button>

              <button 
                onClick={() => setMenuView('armory')}
                className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-800 hover:scale-105 transition-all shadow-xl text-white"
              >
                <Swords size={32} className="text-blue-500 mb-2" />
                <span className="font-black text-lg uppercase tracking-tighter italic">Armory</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Arsenal Status</span>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setMenuView('difficulty')}
                  className={`bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-all text-white`}
                >
                  <Shield size={24} style={{ color: DIFFICULTIES[difficulty].color }} />
                  <span className="font-black text-xs uppercase italic">Difficulty</span>
                  <span className="text-[8px] font-bold uppercase opacity-50" style={{ color: DIFFICULTIES[difficulty].color }}>{difficulty}</span>
                </button>
                <button 
                  onClick={() => setMenuView('profile')}
                  className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-all text-white"
                >
                  <Users size={24} className="text-green-500" />
                  <span className="font-black text-xs uppercase italic">Profile</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Stats</span>
                </button>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 w-full px-6">
              <div className="bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/30 flex items-center justify-center gap-3 w-full max-w-xs md:max-w-md">
                <Coins size={16} className="text-yellow-500 shrink-0" />
                <span className="text-yellow-500 font-black tracking-widest text-[10px] md:text-sm italic truncate">{tacticalCredits.toLocaleString()} TAX CREDITS</span>
              </div>
              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.5em] mt-4 italic">v1.2.0 | Tactical Simulation Environment</p>
            </div>
          </motion.div>
        )}

        {menuView === 'armory' && (
          <motion.div 
            key="armory"
            initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
            className="w-full max-w-4xl max-h-[85vh] overflow-y-auto px-6 z-10 custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8 bg-slate-900/80 p-6 rounded-3xl border border-white/10 backdrop-blur-md sticky top-0 z-20">
              <div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Armory</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Available Weapon Systems</p>
              </div>
              <button 
                onClick={() => setMenuView('main')}
                className="px-6 py-3 bg-white text-slate-950 font-black uppercase text-xs rounded-xl hover:bg-yellow-500 transition-all"
              >
                Return
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
              {(['pistol', 'rifle', 'shotgun', 'sniper'] as WeaponType[]).map(wKey => {
                const weapon = WEAPONS[wKey];
                const upgrades = weaponUpgradeLevels[wKey];
                const avgLevel = (upgrades.damage + upgrades.reload + upgrades.stability) / 3;
                
                return (
                  <div key={wKey} className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-3xl border border-white/5 flex flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
                    
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest block mb-1">Model: {weapon.type.toUpperCase()}</span>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{weapon.name}</h3>
                      </div>
                      <div className="px-3 py-1 bg-white/10 rounded-lg text-white font-black text-[10px] uppercase">
                        LVL {Math.floor(avgLevel)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 z-10">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                          <span>Damage</span>
                          <span className="text-white">{weapon.damage * (1 + upgrades.damage * 0.05)}</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${(weapon.damage / 100) * 100}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                          <span>Fire Rate</span>
                          <span className="text-white">{Math.round(1000 / weapon.fireRate)}/s</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: `${(100 / weapon.fireRate) * 10}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                          <span>Mag Size</span>
                          <span className="text-white">{weapon.magSize}</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(weapon.magSize / 50) * 100}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                          <span>Range</span>
                          <span className="text-white">{weapon.range}m</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${(weapon.range / 1500) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-4 border-t border-white/5 flex gap-2">
                      <div className="flex-1 text-[8px] text-slate-500 uppercase font-black">
                        {weapon.isAuto ? 'Full-Auto Capable' : 'Semi-Automatic'}
                        {weapon.isScoped && <span className="text-blue-400 block">+ Tactical Optics</span>}
                      </div>
                      <button 
                        onClick={() => {
                          setMenuView('main');
                          setUpgradeTab('weapon');
                          setSelectedLabWeapon(wKey);
                          setGameState('upgrades');
                        }}
                        className="text-[9px] font-black uppercase text-yellow-500 hover:text-white transition-colors"
                      >
                        Upgrade in Lab
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {menuView === 'difficulty' && (
          <motion.div 
            key="difficulty"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto px-6 custom-scrollbar py-10"
          >
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Protocol Selection</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10 text-center">Select your difficulty level. Higher danger yields higher rewards.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10">
              {(Object.keys(DIFFICULTIES) as DifficultyKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setDifficulty(key);
                    saveDifficulty(key);
                    sounds.playHit();
                  }}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${
                    difficulty === key 
                      ? 'bg-white text-slate-950 border-white shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95' 
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-black uppercase text-xl italic tracking-tighter">{key}</span>
                    <div className={`w-3 h-3 rounded-full ${difficulty === key ? 'bg-slate-900' : ''}`} style={{ backgroundColor: difficulty !== key ? DIFFICULTIES[key].color : undefined }} />
                  </div>
                  <div className={`text-[9px] font-black uppercase tracking-widest mb-3 ${difficulty === key ? 'text-slate-500' : 'text-slate-600'}`}>Stats Modification</div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold opacity-60">Armor Mult</span>
                      <span className="font-black">x{DIFFICULTIES[key].hpMult}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold opacity-60">Danger Mult</span>
                      <span className="font-black">x{DIFFICULTIES[key].dmgMult}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] mt-2 pt-2 border-t border-current/10">
                      <span className="font-bold text-yellow-600">Credit Rewards</span>
                      <span className="font-black text-yellow-600">{Math.round(DIFFICULTIES[key].creditMult * 100)}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setMenuView('main')}
              className="bg-slate-900 px-10 py-4 rounded-2xl text-white font-black uppercase text-xs border border-white/10 hover:bg-white hover:text-slate-950 transition-all"
            >
              Confirm Strategy
            </button>
          </motion.div>
        )}

        {menuView === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 z-10 max-h-[85vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl border border-blue-500 flex items-center justify-center">
                  <Users className="text-blue-500" size={32} />
                </div>
                <div className="text-left">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Command Profile</h2>
                  <span className="text-green-500 text-[10px] font-black uppercase tracking-widest mt-2 block">Agent Status: Active</span>
                </div>
              </div>
              <button 
                onClick={() => setMenuView('main')}
                className="w-12 h-12 bg-white/5 text-white flex items-center justify-center rounded-xl hover:bg-white hover:text-slate-950 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 text-left">
                <div className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Kills</div>
                <div className="text-3xl font-black text-white">{lifetimeStats.totalKills.toLocaleString()}</div>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 text-left">
                <div className="text-yellow-500 font-bold text-[10px] uppercase tracking-widest mb-1">Lifetime Credits</div>
                <div className="text-3xl font-black text-white">{lifetimeStats.totalCredits.toLocaleString()}</div>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Award className="text-green-500" size={20} />
                </div>
                <div className="text-left">
                  <div className="text-slate-500 font-bold text-[8px] uppercase tracking-widest">Missions Won</div>
                  <div className="text-xl font-black text-white">{lifetimeStats.totalWins}</div>
                </div>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Skull className="text-red-500" size={20} />
                </div>
                <div className="text-left">
                  <div className="text-slate-500 font-bold text-[8px] uppercase tracking-widest">Total Deaths</div>
                  <div className="text-xl font-black text-white">{lifetimeStats.totalDeaths}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center text-left">
                <div>
                  <span className="text-slate-500 font-bold text-[8px] uppercase tracking-widest block">Best Sector Progress</span>
                  <span className="text-white font-black uppercase text-sm">Target Securing: WAVE {lifetimeStats.bestWave}</span>
                </div>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(w => (
                    <div key={w} className={`w-2 h-4 rounded-sm ${w <= lifetimeStats.bestWave ? 'bg-blue-500' : 'bg-slate-800'}`} />
                  ))}
                </div>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center text-left">
                <div>
                  <span className="text-slate-500 font-bold text-[8px] uppercase tracking-widest block">Most Used Protocol</span>
                  <span className="text-white font-black uppercase text-sm">{difficulty}</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: DIFFICULTIES[difficulty].color }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
