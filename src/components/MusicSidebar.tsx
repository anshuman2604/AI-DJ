import React from 'react';
import { Home, Disc, Heart, Sparkles, Terminal, LogOut, Radio, Zap, Flame } from 'lucide-react';

interface MusicSidebarProps {
  activeTab: 'discover' | 'library' | 'favorites' | 'director' | 'logs';
  onTabChange: (tab: 'discover' | 'library' | 'favorites' | 'director' | 'logs') => void;
  isAutoDJActive: boolean;
  onToggleAutoDJ: () => void;
  mixDurationMode: 'QUICK' | 'RADIO' | 'FULL';
  onMixDurationModeChange: (mode: 'QUICK' | 'RADIO' | 'FULL') => void;
  isTransitioning: boolean;
}

export const MusicSidebar: React.FC<MusicSidebarProps> = ({
  activeTab,
  onTabChange,
  isAutoDJActive,
  onToggleAutoDJ,
  mixDurationMode,
  onMixDurationModeChange,
  isTransitioning,
}) => {
  return (
    <aside className="w-64 bg-[#120826]/90 border-r border-purple-900/30 flex flex-col p-6 shrink-0 h-screen sticky top-0 overflow-y-auto custom-scroll select-none">
      {/* Profile Section (Inspired by Reference Image Screen 3) */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="relative">
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-indigo-500 p-0.5 shadow-lg shadow-purple-900/40">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Roman Leone"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {isTransitioning ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-fuchsia-500 border-2 border-[#120826]"></span>
            </span>
          ) : isAutoDJActive ? (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#120826]"></span>
          ) : null}
        </div>
        <div>
          <span className="text-xs font-semibold text-purple-300 block">Hi!</span>
          <h2 className="text-base font-bold text-white tracking-wide">Roman Leone</h2>
          <span className="text-[10px] text-purple-400/80 font-medium">Pro Music Curator</span>
        </div>
      </div>

      {/* Navigation Menu (Screen 3 style) */}
      <nav className="space-y-1.5 mb-8">
        <button
          onClick={() => onTabChange('discover')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'discover'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 translate-x-1'
              : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home & Discover</span>
        </button>

        <button
          onClick={() => onTabChange('library')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'library'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 translate-x-1'
              : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>Playlist & Library</span>
        </button>

        <button
          onClick={() => onTabChange('favorites')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'favorites'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 translate-x-1'
              : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Favorite Mixes</span>
        </button>

        <button
          onClick={() => onTabChange('director')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'director'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 translate-x-1'
              : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Vibe Director</span>
        </button>

        <button
          onClick={() => onTabChange('logs')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'logs'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 translate-x-1'
              : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>DJ Brain Stream</span>
        </button>
      </nav>

      {/* Autonomous Mix Status Card */}
      <div className={`mt-auto rounded-3xl p-4 border transition-all duration-300 relative overflow-hidden ${
        isTransitioning
          ? 'bg-gradient-to-br from-fuchsia-950/80 to-purple-900/80 border-fuchsia-500/50 shadow-xl shadow-fuchsia-950/50 glow-purple-pulse'
          : 'bg-[#180c33]/80 border-purple-800/40'
      }`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isTransitioning ? 'text-fuchsia-400 animate-pulse' : 'text-purple-400'}`} />
            <span className="text-xs font-bold text-white">AI AUTO-MIX</span>
          </div>
          <button
            onClick={onToggleAutoDJ}
            className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center p-0.5 ${
              isAutoDJActive ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' : 'bg-purple-950'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                isAutoDJActive ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-[11px] text-purple-300/80 mb-3 leading-relaxed">
          {isTransitioning ? (
            <span className="text-fuchsia-300 font-semibold animate-pulse flex items-center gap-1">
              <Zap className="w-3 h-3 text-fuchsia-400" /> Harmonic Transitioning...
            </span>
          ) : isAutoDJActive ? (
            'Playing to peak minute & seamless harmonic handover.'
          ) : (
            'Manual mode enabled. Click to let AI curate and blend.'
          )}
        </p>

        {/* Pacing Mode Switcher */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
            Set Pacing
          </span>
          <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl">
            <button
              onClick={() => onMixDurationModeChange('QUICK')}
              className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                mixDurationMode === 'QUICK'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-300/60 hover:text-white'
              }`}
            >
              FAST
            </button>
            <button
              onClick={() => onMixDurationModeChange('RADIO')}
              className={`py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                mixDurationMode === 'RADIO'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow'
                  : 'text-purple-300/60 hover:text-white'
              }`}
            >
              <Flame className="w-2.5 h-2.5" />
              PEAK
            </button>
            <button
              onClick={() => onMixDurationModeChange('FULL')}
              className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                mixDurationMode === 'FULL'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-300/60 hover:text-white'
              }`}
            >
              FULL
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 mt-4 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-400/60">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
          Engine v2.5 Hi-Fi
        </span>
        <button
          onClick={() => onToggleAutoDJ()}
          className="hover:text-purple-200 transition-colors flex items-center gap-1 text-[11px]"
        >
          <LogOut className="w-3 h-3" />
          <span>{isAutoDJActive ? 'Active' : 'Standby'}</span>
        </button>
      </div>
    </aside>
  );
};
