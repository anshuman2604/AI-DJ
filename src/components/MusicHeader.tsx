import React, { useState, useRef } from 'react';
import { Search, SlidersHorizontal, Upload, Sparkles, Key, Link as LinkIcon, Check, Loader2 } from 'lucide-react';

interface MusicHeaderProps {
  onImportUrl: (url: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzing: boolean;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  vibePrompt: string;
  onVibePromptChange: (prompt: string) => void;
}

export const MusicHeader: React.FC<MusicHeaderProps> = ({
  onImportUrl,
  onFileUpload,
  isAnalyzing,
  apiKey,
  onApiKeyChange,
  vibePrompt,
  onVibePromptChange,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onImportUrl(searchInput);
    setSearchInput('');
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-6 md:px-8 border-b border-purple-900/20 bg-[#0d071a]/80 backdrop-blur-xl sticky top-0 z-20">
      {/* Search / Playlist Resolver Input (Screen 2 style) */}
      <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 lg:w-[460px]">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-purple-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search music or paste YouTube / playlist URL..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={isAnalyzing}
            className="w-full bg-[#1b0e38]/80 text-white placeholder-purple-300/40 text-xs sm:text-sm pl-11 pr-24 py-3 rounded-full border border-purple-800/40 focus:border-purple-500 focus:outline-none shadow-inner shadow-black/40 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !searchInput.trim()}
            className="absolute right-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 text-white rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5" />
            )}
            <span>{isAnalyzing ? 'Importing' : 'Import'}</span>
          </button>
        </div>
      </form>

      {/* Action Controls & AI Vibe Prompt (Screen 2 Header Right) */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        {/* Upload Audio File */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          accept="audio/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1b0e38] hover:bg-[#25144c] border border-purple-800/50 text-purple-200 text-xs font-semibold transition-all active:scale-95 shadow"
          title="Upload MP3 or WAV file"
        >
          <Upload className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Add Audio</span>
        </button>

        {/* AI Vibe Prompt Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-[#1b0e38] border border-purple-800/50 px-3 py-1.5 rounded-full shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
          <input
            type="text"
            placeholder="AI Vibe (e.g. Festival peak)..."
            value={vibePrompt}
            onChange={(e) => onVibePromptChange(e.target.value)}
            className="bg-transparent text-xs text-purple-100 placeholder-purple-400/40 focus:outline-none w-44 font-medium"
          />
        </div>

        {/* Settings & Gemini API Key Modal Trigger */}
        <button
          onClick={() => setShowSettingsModal(!showSettingsModal)}
          className={`p-2.5 rounded-full border transition-all ${
            apiKey.trim()
              ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
              : 'bg-[#1b0e38] border-purple-800/50 text-purple-400 hover:text-white'
          }`}
          title="AI DJ Settings & API Key"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Gemini Settings Popover / Modal */}
        {showSettingsModal && (
          <div className="absolute top-16 right-6 w-80 bg-[#160b2e] border border-purple-700/50 rounded-3xl p-5 shadow-2xl shadow-black/80 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3 border-b border-purple-800/40 pb-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI DJ Configuration</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-purple-400 hover:text-white text-xs font-bold"
              >
                Done
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-purple-300 font-medium mb-1">
                  Google Gemini API Key (Optional)
                </label>
                <div className="relative flex items-center">
                  <Key className="w-3.5 h-3.5 text-purple-400 absolute left-3" />
                  <input
                    type="password"
                    placeholder="Enter Gemini API key..."
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    className="w-full bg-[#100724] border border-purple-800/60 rounded-xl pl-9 pr-3 py-2 text-white placeholder-purple-400/40 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-purple-400/70 mt-1">
                  Enables LLM harmonic setlist analysis and intelligent vibe curation.
                </p>
              </div>

              <div>
                <label className="block text-purple-300 font-medium mb-1">
                  Curator Vibe & Atmosphere
                </label>
                <input
                  type="text"
                  placeholder="e.g. Late night melodic techno peak"
                  value={vibePrompt}
                  onChange={(e) => onVibePromptChange(e.target.value)}
                  className="w-full bg-[#100724] border border-purple-800/60 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-2.5 text-[11px] text-purple-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Audio Narration: Silent, seamless harmonic mixing only.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
