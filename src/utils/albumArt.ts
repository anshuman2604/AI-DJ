// Helper to generate vibrant, modern music app album art gradients and imagery

const GRADIENTS = [
  'from-purple-600 via-fuchsia-600 to-indigo-700',
  'from-pink-500 via-rose-600 to-purple-700',
  'from-violet-600 via-purple-700 to-indigo-900',
  'from-indigo-500 via-blue-600 to-purple-800',
  'from-fuchsia-600 via-purple-600 to-pink-700',
  'from-purple-700 via-indigo-600 to-cyan-700',
  'from-rose-500 via-purple-600 to-indigo-700',
  'from-violet-700 via-fuchsia-700 to-purple-900',
];

const CURATED_IMAGES = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&auto=format&fit=crop&q=80',
];

export function getTrackGradient(id: string | number): string {
  const str = String(id || 'default');
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

export function getTrackCoverImage(id: string | number): string {
  const str = String(id || 'default');
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CURATED_IMAGES[hash % CURATED_IMAGES.length];
}
