export interface MostPlayedSection {
  startTime: number;
  endTime: number;
  peakTime: number;
  source: 'YOUTUBE_HEATMAP' | 'AUDIO_ANALYSIS';
  score?: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  bpm: number;
  key: string;
  energy: number;
  genre: string;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  mostPlayed?: MostPlayedSection;
  cuePoints: {
    introStart: number;
    bestCueIn?: number;
    breakdown: number;
    drop: number;
    chorusDrop?: number;
    outroStart: number;
  };
}

export interface DeckState {
  id: 'A' | 'B';
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  lowGain: number;
  midGain: number;
  highGain: number;
  filterFreq: number;
  isStemsActive?: boolean;
}

export type RemixStyle = 'SMOOTH_BLEND' | 'ACAPELLA_DROP' | 'ENERGY_BOOST' | 'QUICK_CUT';

export interface DJDecisionLog {
  id: string;
  timestamp: string;
  type: 'TRACK_SELECTION' | 'TRANSITION_START' | 'EQ_ADJUSTMENT' | 'BEATMATCH' | 'REMIX_TRIGGER';
  message: string;
  details?: {
    fromTrack?: string;
    toTrack?: string;
    keyMatch?: boolean;
    bpmMatch?: boolean;
    energyShift?: string;
    style?: RemixStyle;
  };
}
