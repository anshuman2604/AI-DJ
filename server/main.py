import os
import glob
import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import yt_dlp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-dj-backend")

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

import re
import http.cookiejar

COOKIE_FILE = os.path.join(os.path.dirname(__file__), "cookies.txt")

def sanitize_netscape_cookies(text: str) -> str:
    """
    Normalizes cookies text into valid tab-separated Netscape format.
    Fixes issues where cloud dashboards (e.g. Render, HuggingFace) or browsers
    replace tab characters with spaces or escape newlines (\\n).
    """
    text = text.replace('\\r\\n', '\n').replace('\\n', '\n').replace('\r\n', '\n')
    lines = text.split('\n')
    reconstructed = ['# Netscape HTTP Cookie File', '# Generated & Sanitized by AI DJ']

    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        # If line already has tabs and 7 fields
        if '\t' in line:
            parts = line.split('\t')
            if len(parts) >= 7:
                reconstructed.append('\t'.join(parts[:7]))
                continue
        # If line was space-separated due to web dashboard copy-paste
        parts = re.split(r'\s+', line, maxsplit=6)
        if len(parts) == 7:
            reconstructed.append('\t'.join(parts))
        elif len(parts) == 6:
            parts.append('')
            reconstructed.append('\t'.join(parts))

    return '\n'.join(reconstructed) + '\n'

def validate_or_repair_cookies(filepath: str) -> bool:
    """
    Validates if a cookies file can be successfully parsed by Python's MozillaCookieJar.
    If it fails (e.g. spaces instead of tabs), it automatically repairs the file in-place.
    """
    cj = http.cookiejar.MozillaCookieJar()
    try:
        cj.load(filepath)
        if len(cj) > 0:
            return True
    except Exception:
        pass

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        repaired = sanitize_netscape_cookies(content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(repaired)
        cj.load(filepath)
        if len(cj) > 0:
            logger.info(f"Successfully repaired cookie file formatting in {filepath} ({len(cj)} cookies loaded)")
            return True
    except Exception as err:
        logger.warning(f"Could not load or repair cookies file {filepath}: {err}")

    return False

def setup_cookies():
    """
    Checks for YouTube cookies via environment variable (YOUTUBE_COOKIES / COOKIES_CONTENT)
    or local cookies.txt file, sanitizes the format, and loads it into yt-dlp.
    """
    env_cookies = os.environ.get("YOUTUBE_COOKIES") or os.environ.get("COOKIES_CONTENT")
    if env_cookies:
        try:
            sanitized = sanitize_netscape_cookies(env_cookies.strip())
            with open(COOKIE_FILE, "w", encoding="utf-8") as f:
                f.write(sanitized)
            logger.info("Successfully loaded and sanitized YouTube cookies from environment variable.")
        except Exception as e:
            logger.warning(f"Could not write YOUTUBE_COOKIES to file: {e}")

    search_paths = [
        COOKIE_FILE,
        os.path.join(os.path.dirname(__file__), "..", "cookies.txt"),
        os.path.join(CACHE_DIR, "cookies.txt")
    ]
    for path in search_paths:
        if os.path.exists(path) and os.path.getsize(path) > 10:
            if validate_or_repair_cookies(path):
                return os.path.abspath(path)
            else:
                logger.warning(f"Cookie file at {path} could not be validated. Falling back to mobile clients.")

    return None

def get_ydl_opts(download: bool = False, outtmpl: str = None):
    """
    Constructs robust yt-dlp configuration with mobile/visionos player clients
    to bypass YouTube's datacenter IP bot detection on cloud hosting platforms.
    """
    opts = {
        'quiet': True,
        'no_warnings': True,
        'js_runtimes': {'node': {}},
        'remote_components': ['ejs:github'],
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'visionos', 'ios', 'mweb', 'web']
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
        'socket_timeout': 30,
        'retries': 5,
    }

    if not download:
        opts['skip_download'] = True
    else:
        opts['format'] = 'ba[ext=m4a]/ba/b'
        if outtmpl:
            opts['outtmpl'] = outtmpl

    cookie_file = setup_cookies()
    if cookie_file:
        opts['cookiefile'] = cookie_file
        logger.info(f"Using cookies from: {cookie_file}")

    proxy = os.environ.get("YOUTUBE_PROXY") or os.environ.get("HTTP_PROXY") or os.environ.get("HTTPS_PROXY")
    if proxy:
        opts['proxy'] = proxy

    po_token = os.environ.get("YOUTUBE_PO_TOKEN")
    if po_token:
        opts['extractor_args']['youtube']['po_token'] = [f"web.gvs+{po_token}"]

    return opts

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
        opts = get_ydl_opts(download=False)
        opts['extract_flat'] = 'in_playlist'
        with yt_dlp.YoutubeDL(opts) as ydl:
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
        logger.error(f"Failed to resolve URL {url}: {e}")
        err_msg = str(e)
        if "Sign in to confirm you’re not a bot" in err_msg:
            err_msg += " (Tip: On cloud datacenter IPs, configure YOUTUBE_COOKIES secret or upload cookies.txt)"
        raise HTTPException(status_code=400, detail=err_msg)

@app.get("/api/track-meta")
def get_track_meta(id: str = Query(..., description="YouTube video ID")):
    try:
        opts = get_ydl_opts(download=False)
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={id}", download=False)
            heatmap = info.get('heatmap') or []
            most_played = calculate_most_played_from_heatmap(heatmap)
            return {
                "id": id,
                "duration": info.get('duration', 180),
                "most_played": most_played
            }
    except Exception as e:
        logger.warning(f"Failed to fetch track meta for {id}: {e}")
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

    ydl_opts = get_ydl_opts(download=True, outtmpl=target_pattern)

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
        logger.error(f"Stream download failed for {id}: {e}")
        err_msg = str(e)
        if "Sign in to confirm you’re not a bot" in err_msg:
            err_msg += " (Tip: YouTube blocked the cloud host IP as a bot. Provide cookies.txt or set YOUTUBE_COOKIES environment secret)"
        raise HTTPException(status_code=500, detail=err_msg)

# Serve built React frontend if dist folder exists (single-service free cloud hosting)
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
