import React from 'react';

interface WaveTerrainProps {
  isPlaying: boolean;
  isTransitioning: boolean;
  progressPercent: number;
  lyricsText?: string;
  themeColor?: string;
}

export const WaveTerrain: React.FC<WaveTerrainProps> = ({
  isPlaying,
  isTransitioning,
  lyricsText = "Feel the rhythm flow through the midnight air",
}) => {
  return (
    <div className="relative w-full overflow-hidden select-none my-2 sm:my-4 flex flex-col justify-end">
      {/* Floating Lyric / Vibe Line (as seen in the design mockup) */}
      <div className="relative z-10 text-center px-4 mb-2 sm:mb-4 transition-all duration-700">
        <p className="text-xs sm:text-sm font-medium text-white/70 tracking-wide line-clamp-2 max-w-md mx-auto drop-shadow">
          {isTransitioning ? (
            <span className="text-fuchsia-300 font-semibold flex items-center justify-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
              Harmonic Frequency Mashup In Progress
            </span>
          ) : (
            lyricsText
          )}
        </p>
      </div>

      {/* Layered Waveform Landscape SVG */}
      <div className="relative w-full h-24 sm:h-32 md:h-36">
        {/* Layer 1: Distant Background Wave (Deep & Subdued) */}
        <svg
          className={`absolute bottom-0 left-0 w-[200%] h-full transition-transform duration-1000 opacity-20 ${
            isPlaying ? 'animate-wave-slow' : ''
          }`}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C150,90 350,10 500,50 C650,90 850,20 1000,60 C1150,100 1200,40 1200,40 L1200,120 L0,120 Z"
            fill="currentColor"
            className={isTransitioning ? "text-cyan-400" : "text-purple-400"}
          />
        </svg>

        {/* Layer 2: Midground Wave (Soft Gradient) */}
        <svg
          className={`absolute bottom-0 left-0 w-[200%] h-full transition-transform duration-700 opacity-40 ${
            isPlaying ? 'animate-wave-medium' : ''
          }`}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C200,20 400,90 600,40 C800,10 1000,80 1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
            className={isTransitioning ? "text-fuchsia-400" : "text-purple-500"}
          />
        </svg>

        {/* Layer 3: Foreground Wave (Crisp Silhouette as in mockup) */}
        <svg
          className={`absolute bottom-0 left-0 w-[200%] h-full transition-transform duration-500 opacity-70 ${
            isPlaying ? 'animate-wave-fast' : ''
          }`}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C180,45 320,95 520,60 C720,30 920,85 1100,65 C1160,60 1200,75 1200,75 L1200,120 L0,120 Z"
            fill="currentColor"
            className={isTransitioning ? "text-indigo-400" : "text-purple-700"}
          />
        </svg>

        {/* Subtle Ambient Base Gradient blending into bottom controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
