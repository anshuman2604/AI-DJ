import React from 'react';
import { Sparkles, Wand2, Zap, Radio, Sliders, Layers } from 'lucide-react';

interface DJMixerProps {
  crossfader: number;
  isAutoDJActive: boolean;
  activeRemixStyle?: string;
  mixDurationMode: 'QUICK' | 'RADIO' | 'FULL';
  onCrossfaderChange: (val: number) => void;
  onToggleAutoDJ: () => void;
  onTriggerInstantMix: () => void;
  onMixDurationModeChange: (mode: 'QUICK' | 'RADIO' | 'FULL') => void;
}

export const DJMixer: React.FC<DJMixerProps> = ({
  crossfader,
  isAutoDJActive,
  activeRemixStyle,
  mixDurationMode,
  onCrossfaderChange,
  onToggleAutoDJ,
  onTriggerInstantMix,
  onMixDurationModeChange,
}) => {
  // Acoustic power balance (sin/cos constant power)
  const angle = crossfader * 0.5 * Math.PI;
  const gainA = Math.round(Math.cos(angle) * 100);
  const gainB = Math.round(Math.sin(angle) * 100);

  // Generate dynamic 12-step LED VU meter segments
  const renderVUMeter = (gainPercent: number, theme: 'cyan' | 'fuchsia') => {
    const numLeds = 12;
    const activeCount = Math.round((gainPercent / 100) * numLeds);

    return (
      <div className="flex flex-col-reverse gap-1 h-36 p-1 bg-[#06080c] rounded-lg border border-slate-800/90 shadow-inner w-4">
        {Array.from({ length: numLeds }).map((_, i) => {
          const isActive = i < activeCount;
          let color = 'bg-slate-800';

          if (isActive) {
            if (i >= 10) {
              color = 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'; // +3dB Clip
            } else if (i >= 7) {
              color = 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'; // 0dB Peak
            } else {
              color = theme === 'cyan'
                ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                : 'bg-teal-400 shadow-[0_0_6px_#2dd4bf]';
            }
          }

          return (
            <div
              key={i}
              className={`w-full h-1.5 rounded-xs transition-colors duration-75 ${color}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-84 bg-gradient-to-b from-[#11141e] via-[#0d1017] to-[#08090d] border border-slate-800/90 rounded-3xl p-5 shadow-2xl flex flex-col justify-between backdrop-blur-2xl relative overflow-hidden">
      {/* Top subtle light line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-amber-400 to-fuchsia-500 opacity-60" />

      {/* Top Section: AI Brain Master Switch & HUD */}
      <div className="flex flex-col items-center gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-black text-slate-300 tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>NEXUS DSP MIXER</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isAutoDJActive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {isAutoDJActive ? 'ON AIR' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Big Autonomous AI DJ Button */}
        <button
          onClick={onToggleAutoDJ}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 border ${
            isAutoDJActive
              ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-600 border-indigo-400/60 text-white shadow-indigo-500/30'
              : 'bg-[#090b10] hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          <Wand2 className={`w-4 h-4 ${isAutoDJActive ? 'animate-bounce text-yellow-300' : 'text-slate-400'}`} />
          <span>{isAutoDJActive ? 'AUTONOMOUS AI DJ ACTIVE' : 'ENGAGE AUTONOMOUS AI DJ'}</span>
        </button>

        {/* Set Pacing & Exit Mode Switcher */}
        <div className="w-full mt-1">
          <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex justify-between font-bold">
            <span>SET PACING:</span>
            <span className="text-cyan-400">{mixDurationMode}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-[#06080c] p-1.5 rounded-2xl border border-slate-800/80 text-[10px] font-mono font-black">
            <button
              onClick={() => onMixDurationModeChange('QUICK')}
              className={`py-1.5 rounded-xl transition-all ${
                mixDurationMode === 'QUICK'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Fast festival drop transitions (35s)"
            >
              FAST (35s)
            </button>
            <button
              onClick={() => onMixDurationModeChange('RADIO')}
              className={`py-1.5 rounded-xl transition-all ${
                mixDurationMode === 'RADIO'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Plays Most Played Minute, then transitions immediately!"
            >
              RADIO (Peak)
            </button>
            <button
              onClick={() => onMixDurationModeChange('FULL')}
              className={`py-1.5 rounded-xl transition-all ${
                mixDurationMode === 'FULL'
                  ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Play through entire outro"
            >
              FULL SONG
            </button>
          </div>
        </div>

        {/* Active AI Style Pill */}
        {activeRemixStyle && (
          <div className="w-full text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-xl text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Style: <strong>{activeRemixStyle}</strong></span>
          </div>
        )}
      </div>

      {/* Middle Section: Dual Stereo LED VU Level Meters */}
      <div className="my-4 flex items-center justify-around bg-[#080a10] p-3 rounded-2xl border border-slate-800/80">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono font-bold text-cyan-400">CH A</span>
          {renderVUMeter(gainA, 'cyan')}
          <span className="text-[9px] font-mono text-slate-500">{gainA}%</span>
        </div>

        <div className="flex flex-col items-center justify-center px-3 text-center">
          <div className="w-8 h-8 rounded-full bg-[#121622] border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-md mb-2">
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">dB LEVELS</span>
          <span className="text-[8px] font-mono text-slate-600 mt-1">EQUAL-POWER</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono font-bold text-fuchsia-400">CH B</span>
          {renderVUMeter(gainB, 'fuchsia')}
          <span className="text-[9px] font-mono text-slate-500">{gainB}%</span>
        </div>
      </div>

      {/* Bottom Section: Studio Optical Crossfader */}
      <div className="my-2 flex flex-col items-center">
        <div className="flex justify-between w-full text-xs font-mono mb-2 px-1">
          <span className="font-bold text-cyan-400 flex items-center gap-1">
            ◄ DECK A <strong className="text-[10px] text-slate-500 font-normal">({gainA}%)</strong>
          </span>
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">CROSSFADER</span>
          <span className="font-bold text-fuchsia-400 flex items-center gap-1">
            <strong className="text-[10px] text-slate-500 font-normal">({gainB}%)</strong> DECK B ►
          </span>
        </div>

        {/* Heavy Recessed Crossfader Track */}
        <div className="relative w-full py-4 bg-[#06080d] px-4 rounded-2xl border border-slate-800/90 shadow-inner flex items-center">
          <div className="absolute inset-x-4 h-1 bg-slate-800 rounded-full" />
          <div
            className="absolute h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full pointer-events-none"
            style={{ left: '16px', width: `calc(${crossfader * 100}% - 16px)` }}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={crossfader}
            onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-ew-resize h-3 bg-transparent relative z-10 opacity-90"
            title="Studio Optical Crossfader"
          />
        </div>

        <div className="flex justify-between w-full text-[9px] font-mono text-slate-500 mt-1.5 px-2">
          <span>LEFT (CH-A)</span>
          <span className="text-amber-400/80 font-bold">CENTER (0dB POWER)</span>
          <span>RIGHT (CH-B)</span>
        </div>
      </div>

      {/* Instant Remix Drop Button */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <button
          onClick={onTriggerInstantMix}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white rounded-2xl text-xs font-black tracking-wide transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 border border-amber-400/30"
          title="Instantly execute a smooth, phrase-locked drop transition"
        >
          <Zap className="w-4 h-4 text-yellow-300 fill-current animate-pulse" />
          <span>REMIX DROP NOW (PHRASE-LOCKED)</span>
        </button>
      </div>
    </div>
  );
};
