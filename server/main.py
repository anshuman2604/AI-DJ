import os
import glob
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import yt_dlp

app = FastAPI(title="AI DJ Fast Audio Streaming Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE_DIR = os.path.join(os.path.dirname(__file__), "audio_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

ydl_resolve_opts = {
    'format': 'bestaudio/best',
    'quiet': True,
    'no_warnings': True,
    'extract_flat': 'in_playlist',
    'skip_download': True,
}

def calculate_most_played_from_heatmap(heatmap, window_sec=60.0):
    if not heatmap or len(heatmap) == 0:
        return None
    best_start = 0.0
    max_score = -1.0
    for p in heatmap:
        w_start = p.get('start_time', 0.0)
        w_end = w_start + window_sec
        sub = [pt.get('value', 0) for pt in heatmap if pt.get('start_time', 0) >= w_start and pt.get('end_time', 0) <= w_end]
        if sub:
            avg = sum(sub) / len(sub)
            if avg > max_score:
                max_score = avg
                best_start = w_start

    # Find peak timestamp inside the most played window
    peak_time = best_start + 30.0
    peak_val = -1.0
    for p in heatmap:
        if p.get('start_time', 0.0) >= best_start and p.get('end_time', 0.0) <= best_start + window_sec:
            if p.get('value', 0.0) > peak_val:
                peak_val = p.get('value', 0.0)
                peak_time = (p.get('start_time', 0.0) + p.get('end_time', 0.0)) / 2.0

    return {
        "start": round(best_start, 1),
        "end": round(best_start + window_sec, 1),
        "peak": round(peak_time, 1),
        "score": round(max_score, 3),
        "source": "YOUTUBE_HEATMAP"
    }

@app.get("/api/resolve")
def resolve_url(url: str = Query(..., description="YouTube video or playlist URL")):
    try:
        with yt_dlp.YoutubeDL(ydl_resolve_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            tracks = []
            if 'entries' in info:
                for entry in info['entries']:
                    if not entry:
                        continue
                    tracks.append({
                        "id": entry.get("id"),
                        "title": entry.get("title", "Unknown Title"),
                        "artist": entry.get("uploader", "YouTube Artist"),
                        "duration": entry.get("duration", 180),
                        "url": f"https://www.youtube.com/watch?v={entry.get('id')}"
                    })
            else:
                heatmap = info.get("heatmap") or []
                most_played = calculate_most_played_from_heatmap(heatmap)
                tracks.append({
                    "id": info.get("id"),
                    "title": info.get("title", "Unknown Title"),
                    "artist": info.get("uploader", "YouTube Artist"),
                    "duration": info.get("duration", 180),
                    "url": url,
                    "most_played": most_played
                })

            return {"success": True, "count": len(tracks), "tracks": tracks}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/track-meta")
def get_track_meta(id: str = Query(..., description="YouTube video ID")):
    try:
        ydl_opts = {'quiet': True, 'skip_download': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={id}", download=False)
            heatmap = info.get('heatmap') or []
            most_played = calculate_most_played_from_heatmap(heatmap)
            return {
                "id": id,
                "duration": info.get('duration', 180),
                "most_played": most_played
            }
    except Exception as e:
        return {"id": id, "most_played": None}

@app.get("/api/stream")
def stream_audio(id: str = Query(..., description="YouTube video ID")):
    """
    Downloads audio into high-speed local disk cache on first request,
    then serves instantly as FileResponse with full CORS and byte-range support.
    Subsequent requests take 0ms!
    """
    matches = glob.glob(os.path.join(CACHE_DIR, f"{id}.*"))
    if matches and os.path.exists(matches[0]):
        cached_file = matches[0]
        ext = os.path.splitext(cached_file)[1].lstrip('.').lower()
        media_type = f"audio/{ext}" if ext != 'm4a' else 'audio/mp4'
        return FileResponse(cached_file, media_type=media_type)

    video_url = f"https://www.youtube.com/watch?v={id}"
    target_pattern = os.path.join(CACHE_DIR, f"{id}.%(ext)s")

    ydl_opts = {
        'format': 'ba[ext=m4a]/ba/b',
        'outtmpl': target_pattern,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])

        new_matches = glob.glob(os.path.join(CACHE_DIR, f"{id}.*"))
        if not new_matches:
            raise HTTPException(status_code=404, detail="Audio file could not be downloaded")

        cached_file = new_matches[0]
        ext = os.path.splitext(cached_file)[1].lstrip('.').lower()
        media_type = f"audio/{ext}" if ext != 'm4a' else 'audio/mp4'
        return FileResponse(cached_file, media_type=media_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve built React frontend if dist folder exists (single-service free cloud hosting)
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
