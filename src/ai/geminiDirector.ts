// Gemini LLM Service: The AI DJ Creative Director & Voice Host
// Uses Google Gemini API to analyze vibe, select next track, and write DJ speech

import { Track } from '../types/dj';

export interface GeminiDJResponse {
  selectedTrackId: string;
  creativeReasoning: string;
  transitionStyle: 'SMOOTH_BLEND' | 'ACAPELLA_DROP' | 'ENERGY_BOOST' | 'QUICK_CUT';
  djVoiceSpeech: string;
}

export async function askGeminiCreativeDirector(
  apiKey: string,
  vibePrompt: string,
  currentTrack: Track,
  candidatePool: Track[]
): Promise<GeminiDJResponse | null> {
  if (!apiKey || !apiKey.trim()) return null;

  const prompt = `
You are an expert club/festival DJ and host known as "AI DJ Apex".
You are currently playing:
- "${currentTrack.title}" by ${currentTrack.artist} (BPM: ${currentTrack.bpm}, Key: ${currentTrack.key}, Energy: ${currentTrack.energy})

The user's desired vibe/atmosphere is: "${vibePrompt || 'Build up high energy club atmosphere'}"

Here are the candidate tracks available in the playlist pool:
${candidatePool.map(t => `- ID: ${t.id} | Title: "${t.title}" by ${t.artist} | BPM: ${t.bpm} | Key: ${t.key} | Energy: ${t.energy}`).join('\n')}

Select the single BEST track to play next. Consider harmonic mixing, tempo flow, and the requested vibe.
Respond strictly in valid JSON format with this exact schema:
{
  "selectedTrackId": "the ID of the chosen track",
  "creativeReasoning": "1-2 sentences explaining why this track fits the vibe and set progression",
  "transitionStyle": "SMOOTH_BLEND" or "ACAPELLA_DROP" or "ENERGY_BOOST" or "QUICK_CUT",
  "djVoiceSpeech": "A short, punchy 10-15 word radio/club DJ shoutout to hype up the crowd as the transition happens (e.g., 'Switching gears right now into Synapse—let\\'s take the energy higher!')"
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      console.error('Gemini API Error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text) as GeminiDJResponse;
  } catch (error) {
    console.error('Failed to query Gemini:', error);
    return null;
  }
}

// Browser Speech Synthesis for the Live DJ Voice
export function speakDJVoice(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // Cancel any lingering speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05; // Slightly faster for DJ delivery
  utterance.pitch = 0.95; // Slightly deeper radio voice
  
  // Try to pick an energetic English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David')));
  if (preferredVoice) utterance.voice = preferredVoice;

  window.speechSynthesis.speak(utterance);
}
