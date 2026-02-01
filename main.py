from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import yt_dlp
import os
import json
import shutil
import threading
import httpx
import urllib.parse
from fastapi.responses import HTMLResponse, Response
from datetime import datetime
from contextlib import asynccontextmanager

def get_ips():
    import socket
    local_ip = "Unknown"
    
    # Get Network IP
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except:
        pass
    return local_ip

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Logika startup lainnya bisa ditaruh di sini jika ada
    yield

app = FastAPI(lifespan=lifespan)

# Folder penyimpanan
CACHE_DIR = "cached_videos"
META_DIR = os.path.join(CACHE_DIR, "metadata")
SUB_DIR = os.path.join(CACHE_DIR, "subtitles")
THUMB_DIR = os.path.join(CACHE_DIR, "thumbnails")
DATA_DIR = "server_data"
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
SEARCH_HISTORY_FILE = os.path.join(DATA_DIR, "search_history.json")
PLAYLISTS_FILE = os.path.join(DATA_DIR, "playlists.json")
SUBSCRIPTIONS_FILE = os.path.join(DATA_DIR, "subscriptions.json")

# 1. Global Cache for YouTube Info (LRU) to prevent slow re-fetching
from functools import lru_cache
import time

# Simple Dictionary cache for YouTube Info (valid for 6 hours)
YT_INFO_CACHE = {}
CACHE_VALID_TIME = 6 * 3600 # 6 Hours

def get_cached_info(video_id):
    if video_id in YT_INFO_CACHE:
        entry, timestamp = YT_INFO_CACHE[video_id]
        if time.time() - timestamp < CACHE_VALID_TIME:
            return entry
    return None

def set_cached_info(video_id, info):
    YT_INFO_CACHE[video_id] = (info, time.time())
    # Prune cache if too large
    if len(YT_INFO_CACHE) > 500:
        oldest = sorted(YT_INFO_CACHE.keys(), key=lambda k: YT_INFO_CACHE[k][1])[0]
        del YT_INFO_CACHE[oldest]

for d in [CACHE_DIR, META_DIR, SUB_DIR, THUMB_DIR, DATA_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

# Initialize files if not exists
for f_path in [HISTORY_FILE, SEARCH_HISTORY_FILE, PLAYLISTS_FILE, SUBSCRIPTIONS_FILE]:
    if not os.path.exists(f_path):
        with open(f_path, 'w', encoding='utf-8') as f:
            default_val = {} if f_path == PLAYLISTS_FILE else []
            json.dump(default_val, f)

# Akses file offline
app.mount("/offline", StaticFiles(directory=CACHE_DIR), name="offline")
app.mount("/subs", StaticFiles(directory=SUB_DIR), name="subs")

# Global Registry untuk Download yang sedang berjalan
# key: video_id, value: managed_download_object
active_downloads = {}

class DownloadCancelled(Exception):
    pass

def progress_hook(d):
    video_id = d.get('info_dict', {}).get('id')
    if video_id and video_id in active_downloads:
        if active_downloads[video_id].get('cancelled'):
            raise DownloadCancelled("Download dibatalkan oleh user.")

@app.get("/cancel_download")
async def cancel_download(video_id: str):
    if video_id in active_downloads:
        active_downloads[video_id]['cancelled'] = True
        return {"status": "cancelling", "id": video_id}
    return {"status": "not_running"}
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoRequest(BaseModel):
    query: str
    offset: int = 1

class HistoryItem(BaseModel):
    id: str
    title: str
    thumbnail: str
    uploader: str
    channel_id: str = ""
    duration: int
    views: int = 0
    is_offline: bool = False

class SearchHistoryRequest(BaseModel):
    query: str

class PlaylistVideoRequest(BaseModel):
    playlist_name: str
    video: HistoryItem

@app.get("/", response_class=HTMLResponse)
async def get_index():
    if not os.path.exists("index.html"):
        return "<h1>Error: File index.html tidak ditemukan</h1>"
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

async def download_subs_local(video_id: str, subtitles_list: list):
    """Downloads remote subtitle VTT files to local cache directory"""
    local_subs = []
    async with httpx.AsyncClient() as client:
        for sub in subtitles_list:
            try:
                # filename format: videoID_lang_type.vtt
                type_label = "manual" # Simplified for internal tracking
                local_filename = f"{video_id}_{sub['lang']}_{type_label}.vtt"
                local_path = os.path.join(SUB_DIR, local_filename)
                
                if not os.path.exists(local_path):
                    resp = await client.get(sub["url"])
                    if resp.status_code == 200:
                        with open(local_path, "wb") as f:
                            f.write(resp.content)
                
                if os.path.exists(local_path):
                    local_subs.append({
                        "lang": sub["lang"],
                        "url": f"/subs/{local_filename}",
                        "label": sub["label"]
                    })
            except Exception as e:
                print(f"Failed to download sub {sub['lang']} for {video_id}: {e}")
    return local_subs

async def download_thumbnail_local(video_id: str, remote_url: str):
    """Downloads remote thumbnail to local thumbnails directory"""
    if not remote_url:
        return ""
    
    # Extract extension if possible, default to jpg
    ext = "jpg"
    if ".webp" in remote_url: ext = "webp"
    elif ".png" in remote_url: ext = "png"
    
    local_filename = f"{video_id}.{ext}"
    local_path = os.path.join(THUMB_DIR, local_filename)
    local_url = f"/offline/thumbnails/{local_filename}"
    
    if os.path.exists(local_path):
        return local_url
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(remote_url)
            if resp.status_code == 200:
                with open(local_path, "wb") as f:
                    f.write(resp.content)
                return local_url
    except Exception as e:
        print(f"Thumbnail download failed for {video_id}: {e}")
    
    return remote_url # Fallback to remote if download fails

def download_video_and_meta(video_id: str, video_info: dict):
    # Lock sudah dilakukan di main thread caller
    base_name = os.path.join(CACHE_DIR, video_id)
    final_mp4 = base_name + ".mp4"
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    
    # Thumbnail sync download
    remote_thumb = video_info.get("thumbnail")
    if remote_thumb and not remote_thumb.startswith("/offline/"):
        try:
            import httpx as sync_httpx
            with sync_httpx.Client() as client:
                resp = client.get(remote_thumb)
                if resp.status_code == 200:
                    ext = "webp" if ".webp" in remote_thumb else "jpg"
                    local_filename = f"{video_id}.{ext}"
                    local_path = os.path.join(THUMB_DIR, local_filename)
                    with open(local_path, "wb") as f:
                        f.write(resp.content)
                    video_info["thumbnail"] = f"/offline/thumbnails/{local_filename}"
        except Exception as e:
            print(f"Thumbnail download failed: {e}")

    ydl_opts = {
        'format': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[ext=mp4]/best',
        'outtmpl': base_name + ".%(ext)s",
        'quiet': True,
        'no_warnings': True,
        'merge_output_format': 'mp4',
        'progress_hooks': [progress_hook],
        'concurrent_fragment_downloads': 5, # Speed up and reduce connection overhead
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            if not video_info.get('height') and info.get('height'):
                video_info['height'] = info['height']
            
            if not os.path.exists(final_mp4):
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
        
        # Save meta only if not cancelled and exists
        if not active_downloads[video_id]['cancelled'] and os.path.exists(final_mp4):
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(video_info, f, ensure_ascii=False, indent=4)
            print(f"Download success: {video_id}")

    except DownloadCancelled:
        print(f"Download dihentikan: {video_id}")
        # Hapus file sampah/part jika ada
        for ext in ['.mp4', '.m4a', '.webm', '.part', '.ytdl']:
            f_part = base_name + ext
            if os.path.exists(f_part):
                try: os.remove(f_part)
                except: pass
    except Exception as e:
        print(f"Download error {video_id}: {e}")
    finally:
        active_downloads.pop(video_id, None)

@app.post("/extract")
def extract_video(video_req: VideoRequest):
    search_query = video_req.query.strip()
    offset = video_req.offset
    limit = 20
    
    if not search_query.startswith(("http://", "https://")):
        search_query = f"ytsearch{offset + limit - 1}:{search_query}"
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True, 
        'playliststart': offset,
        'playlistend': offset + limit - 1,
        'ignoreerrors': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_query, download=False)
            results = []
            entries = info.get('entries', [info])
            
            base_uploader = info.get('uploader') or info.get('channel') or info.get('title')
            base_channel_id = info.get('channel_id') or info.get('uploader_id') or (info.get('id') if 'channel' in info.get('webpage_url', '') else None)

            for entry in entries:
                if entry:
                    video_id = entry.get('id')
                    meta_path = os.path.join(META_DIR, f"{video_id}.json")
                    is_ready = os.path.exists(os.path.join(CACHE_DIR, f"{video_id}.mp4")) and \
                               os.path.exists(meta_path)
                    
                    # Try to get height from local meta if exists
                    h = entry.get('height')
                    if is_ready:
                        try:
                            with open(meta_path, 'r', encoding='utf-8') as f:
                                m = json.load(f)
                                if m.get('height'): h = m['height']
                        except: pass

                    results.append({
                        "title": entry.get('title'),
                        "thumbnail": entry.get('thumbnails')[0]['url'] if entry.get('thumbnails') else entry.get('thumbnail'),
                        "uploader": entry.get('uploader') or entry.get('channel') or base_uploader,
                        "channel_id": entry.get('channel_id') or entry.get('uploader_id') or base_channel_id,
                        "duration": entry.get('duration'),
                        "id": video_id,
                        "views": entry.get('view_count', 0),
                        "height": h,
                        "is_offline": is_ready
                    })

            found_channel_id = None
            if search_query.startswith('ytsearch') and '"' in search_query:
                 if results and results[0].get('channel_id'):
                     found_channel_id = results[0]['channel_id']

            return {"results": results, "found_channel_id": found_channel_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def get_lang_name(lang_code: str):
    """Converts ISO language codes to readable names and cleans labels"""
    mapping = {
        'id': 'Indonesia', 'en': 'English', 'ja': 'Japanese', 'ko': 'Korean',
        'zh': 'Chinese', 'zh-hans': 'Chinese (Simplified)', 'zh-hant': 'Chinese (Traditional)',
        'zh-tw': 'Chinese (Taiwan)', 'zh-hk': 'Chinese (Hong Kong)',
        'fr': 'French', 'es': 'Spanish', 'de': 'German', 'ru': 'Russian',
        'it': 'Italian', 'pt': 'Portuguese', 'vi': 'Vietnamese', 'th': 'Thai',
        'tr': 'Turkish', 'ar': 'Arabic', 'hi': 'Hindi', 'ms': 'Malay',
        'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish', 'da': 'Danish',
        'fi': 'Finnish', 'no': 'Norwegian', 'cs': 'Czech', 'el': 'Greek',
        'hu': 'Hungarian', 'ro': 'Romanian', 'sk': 'Slovak', 'uk': 'Ukrainian'
    }
    # Clean language code (e.g., 'en-US' -> 'en', 'en-orig' -> 'en')
    clean_code = lang_code.split(' ')[0].split('-')[0].lower()
    name = mapping.get(lang_code.lower(), mapping.get(clean_code, lang_code))
    
    # Remove common tags
    for tag in ["(Manual)", "(Auto)", "[auto]", "manual", "ASR"]:
        name = name.replace(tag, "").strip()
    return name

def download_subtitle(url, video_id, lang):
    """Sync helper to download subtitle and ensure it is a valid VTT file"""
    local_name = f"{video_id}_{lang}.vtt"
    local_path = os.path.join(SUB_DIR, local_name)
    
    # Check cache first
    if os.path.exists(local_path):
        # Even if exists, check if it's a broken M3U8 from previous attempts
        with open(local_path, 'r', encoding='utf-8', errors='ignore') as f:
            first_line = f.readline()
            if first_line.startswith("WEBVTT"):
                return f"/subs/{local_name}"
            else:
                os.remove(local_path) # Delete broken cached file
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.youtube.com/"
        }
        with httpx.Client() as client:
            resp = client.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                content = resp.text
                # YouTube sometimes returns HLS playlist for auto-captions even with fmt=vtt
                if content.strip().startswith("WEBVTT"):
                    with open(local_path, "w", encoding='utf-8') as f:
                        f.write(content)
                    return f"/subs/{local_name}"
                else:
                    print(f"Skipping subtitle {lang}: Not a valid WEBVTT format (Found M3U8 or other)")
    except Exception as e:
        print(f"Failed to download subtitle {lang}: {e}")
    return None

def extract_subtitles(info: dict):
    """Helper to extract subtitles (MANUAL ONLY) and download them locally"""
    subtitles = []
    video_id = info.get('id')
    preferred_langs = ['id', 'en', 'ko', 'ja', 'ms', 'zh']
    
    # We ONLY use 'subtitles' (Manual) and IGNORE 'automatic_captions' (Auto)
    captions = info.get('subtitles', {})
    processed_langs = set()

    def add_sub(c_lang, c_info):
        vtt_sub = next((s['url'] for s in c_info if s.get('ext') == 'vtt'), None)
        if vtt_sub:
            local_url = download_subtitle(vtt_sub, video_id, c_lang)
            if local_url:
                lbl = get_lang_name(c_lang)
                subtitles.append({"lang": c_lang, "url": local_url, "label": lbl})
                processed_langs.add(c_lang.split('-')[0].lower())
                return True
        return False

    # 1. Process Preferred Manual Subtitles
    for lang in preferred_langs:
        # Sort keys to prioritize exact matches (e.g., 'en' before 'en-US')
        sorted_keys = sorted(captions.keys(), key=len)
        for c_lang in sorted_keys:
            c_info = captions[c_lang]
            if c_lang.split('-')[0].lower() == lang and c_lang.split('-')[0].lower() not in processed_langs:
                add_sub(c_lang, c_info)

    # 2. Add other manual languages if the list is short
    if len(subtitles) < 10:
        for c_lang, c_info in captions.items():
            if c_lang.split('-')[0].lower() not in processed_langs:
                if add_sub(c_lang, c_info):
                    if len(subtitles) >= 15: break
    
    return subtitles



def refresh_meta_task(video_id: str, meta_path: str):
    """Refreshes metadata (subtitles, views, thumbnails) and downloads them locally"""
    try:
        ydl_opts = {'format': 'best', 'quiet': True, 'writesubtitles': True, 'allsubtitles': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
            
            # extract_subtitles is already sync and takes care of downloading
            meta["subtitles"] = extract_subtitles(info)
            meta["views"] = info.get('view_count', meta.get('views', 0))
            if not meta.get('channel_id') and info.get('channel_id'):
                meta["channel_id"] = info.get('channel_id') or info.get('uploader_id')
            
            remote_thumb = info.get('thumbnail') or meta.get('thumbnail_remote')
            if remote_thumb and remote_thumb.startswith('http'):
                meta["thumbnail_remote"] = remote_thumb
                # Inline sync thumbnail download
                try:
                    with httpx.Client() as client:
                        resp = client.get(remote_thumb)
                        if resp.status_code == 200:
                            ext = "webp" if ".webp" in remote_thumb else "jpg"
                            local_filename = f"{video_id}.{ext}"
                            local_path = os.path.join(THUMB_DIR, local_filename)
                            with open(local_path, "wb") as f:
                                f.write(resp.content)
                            meta["thumbnail"] = f"/offline/thumbnails/{local_filename}"
                except: pass
            
            with open(meta_path, 'w', encoding='utf-8') as fw:
                json.dump(meta, fw, ensure_ascii=False, indent=4)
            
            # Sync update of history/playlists
            try:
                if os.path.exists(HISTORY_FILE):
                    with open(HISTORY_FILE, 'r+', encoding='utf-8') as f:
                        hist = json.load(f)
                        updated_h = False
                        for item in hist:
                            if item['id'] == video_id and not item.get('channel_id') and meta.get('channel_id'):
                                item['channel_id'] = meta['channel_id']
                                updated_h = True
                        if updated_h:
                            f.seek(0); json.dump(hist, f, ensure_ascii=False, indent=4); f.truncate()

                if os.path.exists(PLAYLISTS_FILE):
                    with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
                        pl = json.load(f)
                        updated_p = False
                        for name in pl:
                            for item in pl[name]:
                                if item['id'] == video_id and not item.get('channel_id') and meta.get('channel_id'):
                                    item['channel_id'] = meta['channel_id']
                                    updated_p = True
                        if updated_p:
                            f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
            except: pass

    except Exception as e:
        print(f"Background refresh failed for {video_id}: {e}")

@app.get("/get_stream")
def get_stream(video_id: str, background_tasks: BackgroundTasks):
    local_file = os.path.join(CACHE_DIR, f"{video_id}.mp4")
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    
    local_format = None
    existing_meta = {}
    
    # 1. Load Local Metadata (FAST)
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                existing_meta = json.load(f)
        except: pass

    # Helper to format size
    def format_size(bytes):
        if not bytes: return ""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes < 1024: return f"{bytes:.1f}{unit}"
            bytes /= 1024
        return f"{bytes:.1f}TB"

    # 2. Check Local File
    if os.path.exists(local_file):
        h = existing_meta.get('height', 480)
        size_bytes = os.path.getsize(local_file)
        local_format = {
            "url": f"/offline/{video_id}.mp4", 
            "quality": f"Local ({h}p - {format_size(size_bytes)})", 
            "height": h,
            "is_local": True
        }

    # 3. IF OFFLINE: RETURN IMMEDIATELY (ULTRA FAST)
    if local_format:
        # Check if we have cached online formats to include them without waiting
        cached_online = get_cached_info(video_id)
        other_formats = []
        if cached_online:
            for f in cached_online.get('formats', []):
                if f.get('url') and f.get('acodec') != 'none' and f.get('vcodec') != 'none':
                    h = f.get('height') or 0
                    if h != local_format['height']: # Don't duplicate local
                        other_formats.append({
                            "url": f['url'],
                            "quality": f"{h}p ({format_size(f.get('filesize') or f.get('filesize_approx'))})",
                            "height": h,
                            "is_local": False
                        })
        
        # Schedule meta refresh in background if we don't have cached info or data is old
        if not cached_online or "subtitles" not in existing_meta or existing_meta.get("views", 0) == 0:
            background_tasks.add_task(refresh_meta_task, video_id, meta_path)

        return {
            "stream_url": local_format['url'],
            "formats": [local_format] + sorted(other_formats, key=lambda x: x['height'], reverse=True),
            "is_offline": True,
            "status": "playing",
            "subtitles": [s for s in existing_meta.get('subtitles', []) if s.get('url', '').startswith('/subs/')],
            "title": existing_meta.get('title', 'Unknown'),
            "uploader": existing_meta.get('uploader', 'Unknown'),
            "channel_id": existing_meta.get('channel_id'),
            "duration": existing_meta.get('duration'),
            "views": existing_meta.get('views', 0)
        }

    # 4. IF ONLINE or NO CACHE: Fetch from YouTube (Synchronous but runs in thread pool)
    online_info = get_cached_info(video_id)
    if not online_info:
        ydl_opts = {'quiet': True, 'no_warnings': True, 'writesubtitles': True, 'allsubtitles': True}
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                online_info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
                set_cached_info(video_id, online_info)
        except Exception as e:
            print(f"Could not fetch online formats: {e}")
            raise HTTPException(status_code=400, detail="Gagal mengambil aliran video")

    # Process Info
    subtitles = [] # Online play, hide subs as requested
    
    unique_formats = []
    available_formats = []
    for f in online_info.get('formats', []):
        if f.get('url') and f.get('acodec') != 'none' and f.get('vcodec') != 'none':
            h = f.get('height') or 0
            size_bytes = f.get('filesize') or f.get('filesize_approx')
            size_str = format_size(size_bytes) if size_bytes else "Stream"
            available_formats.append({
                "url": f['url'],
                "quality": f"{h}p ({size_str})",
                "height": h,
                "is_local": False
            })
    
    available_formats.sort(key=lambda x: x['height'], reverse=True)
    seen_heights = set()
    for f in available_formats:
        if f['height'] not in seen_heights:
            unique_formats.append(f)
            seen_heights.add(f['height'])

    # Fast return for online streaming
    if video_id not in active_downloads:
        # We pass a copy of info or just let the thread handle it
        active_downloads[video_id] = {'cancelled': False}
        def background_info_process():
            try:
                # This performs local VTT downloads, which can be slow
                bg_subs = extract_subtitles(online_info)
                video_info_to_save = {
                    "id": video_id, 
                    "title": online_info.get('title'),
                    "thumbnail": online_info.get('thumbnail'),
                    "uploader": online_info.get('uploader') or online_info.get('channel'),
                    "channel_id": online_info.get('channel_id') or online_info.get('uploader_id'),
                    "duration": online_info.get('duration'),
                    "views": online_info.get('view_count', 0),
                    "is_offline": True, 
                    "subtitles": bg_subs
                }
                download_video_and_meta(video_id, video_info_to_save)
            except Exception as e:
                print(f"Background process error: {e}")
            finally:
                active_downloads.pop(video_id, None)

        threading.Thread(target=background_info_process, daemon=True).start()

    return {
        "stream_url": unique_formats[0]['url'],
        "formats": unique_formats,
        "is_offline": False,
        "status": "fetching_to_offline",
        "subtitles": [],
        "title": online_info.get('title'),
        "uploader": online_info.get('uploader') or online_info.get('channel'),
        "channel_id": online_info.get('channel_id'),
        "duration": online_info.get('duration'),
        "views": online_info.get('view_count', 0)
    }




@app.get("/get_video_meta/{video_id}")
def get_video_meta(video_id: str):
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f: return json.load(f)
        except: pass
    return {}

@app.get("/list_offline")
def list_offline():
    videos = []
    if os.path.exists(META_DIR):
        for filename in sorted(os.listdir(META_DIR), reverse=True):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(META_DIR, filename), 'r', encoding='utf-8') as f:
                        v = json.load(f)
                        if os.path.exists(os.path.join(CACHE_DIR, f"{v['id']}.mp4")): videos.append(v)
                except: continue
    return {"results": videos}

@app.delete("/delete_offline/{video_id}")
def delete_offline(video_id: str):
    try:
        for p in [os.path.join(CACHE_DIR, f"{video_id}.mp4"), os.path.join(CACHE_DIR, f"{video_id}.mp4.part"), os.path.join(META_DIR, f"{video_id}.json")]:
            if os.path.exists(p): os.remove(p)
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/save_history")
def save_history(item: HistoryItem):
    if item.duration == 0 and item.views == 0: return {"status": "ignored"}
    try:
        history = []
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                history = json.load(f)
        history = [h for h in history if h.get('id') != item.id]
        history.insert(0, item.dict()); history = history[:100]
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=4)
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/list_history")
def list_history():
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {"results": [h for h in data if not (h.get('duration') == 0 and h.get('views', 0) == 0)]}
    except: return {"results": []}

@app.delete("/delete_history/{video_id}")
def delete_history(video_id: str):
    try:
        with open(HISTORY_FILE, 'r+', encoding='utf-8') as f:
            history = json.load(f); history = [h for h in history if h.get('id') != video_id]
            f.seek(0); json.dump(history, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: raise HTTPException(status_code=500)

@app.post("/clear_history")
def clear_history():
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f: json.dump([], f)
        return {"status": "success"}
    except: raise HTTPException(status_code=500)

@app.get("/search_suggestions")
async def get_suggestions(q: str):
    if not q: return {"suggestions": []}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://suggestqueries.google.com/complete/search?client=firefox&q={q}")
            return {"suggestions": resp.json()[1]}
    except: return {"suggestions": []}

@app.get("/list_search_history")
def list_search_history():
    try:
        with open(SEARCH_HISTORY_FILE, 'r', encoding='utf-8') as f: return {"results": json.load(f)}
    except: return {"results": []}

@app.post("/save_search_history")
def save_search_history(req: SearchHistoryRequest):
    q = req.query.strip()
    if not q: return {"status": "ignored"}
    try:
        with open(SEARCH_HISTORY_FILE, 'r+', encoding='utf-8') as f:
            hist = json.load(f); hist = [h for h in hist if h != q]
            hist.insert(0, q); hist = hist[:8]
            f.seek(0); json.dump(hist, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: return {"status": "error"}

@app.delete("/delete_search_history")
def delete_search_history(q: str):
    try:
        with open(SEARCH_HISTORY_FILE, 'r+', encoding='utf-8') as f:
            hist = json.load(f); hist = [h for h in hist if h != q]
            f.seek(0); json.dump(hist, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: return {"status": "error"}

@app.get("/list_playlists")
def list_playlists():
    try:
        with open(PLAYLISTS_FILE, 'r', encoding='utf-8') as f: return json.load(f)
    except: return {}

@app.post("/add_to_playlist")
def add_to_playlist(req: PlaylistVideoRequest):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            pl = json.load(f); name = req.playlist_name.strip()
            if not name: raise HTTPException(status_code=400)
            if name not in pl: pl[name] = []
            pl[name] = [v for v in pl[name] if v['id'] != req.video.id]
            pl[name].insert(0, req.video.dict())
            f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500)

@app.post("/update_playlist_meta")
def update_playlist_meta(req: PlaylistVideoRequest):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            pl = json.load(f); name = req.playlist_name
            if name in pl:
                upd = False
                for i, v in enumerate(pl[name]):
                    if v['id'] == req.video.id:
                        if not v.get('channel_id') and req.video.channel_id: v['channel_id'] = req.video.channel_id; upd = True
                        if not v.get('duration') and req.video.duration: v['duration'] = req.video.duration; upd = True
                        break
                if upd: f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: return {"status": "error"}

@app.post("/update_playlist_channel_by_uploader")
def update_playlist_channel_by_uploader(data: dict):
    try:
        name, up, cid = data.get("playlist_name"), data.get("uploader"), data.get("channel_id")
        if not all([name, up, cid]): return {"status": "ignored"}
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            pl = json.load(f)
            if name in pl:
                upd = 0; target = up.replace('"', '')
                for i, v in enumerate(pl[name]):
                    if (v.get('uploader') == target or v.get('uploader') == up) and not v.get('channel_id'):
                        v['channel_id'] = cid; upd += 1
                if upd: f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
                return {"status": "repaired", "count": upd}
        return {"status": "no_change"}
    except: return {"status": "error"}

@app.get("/list_subscriptions")
def list_subscriptions():
    try:
        with open(SUBSCRIPTIONS_FILE, 'r', encoding='utf-8') as f: return {"results": json.load(f)}
    except: return {"results": []}

@app.post("/toggle_subscription")
def toggle_subscription(data: dict):
    try:
        with open(SUBSCRIPTIONS_FILE, 'r+', encoding='utf-8') as f:
            subs = json.load(f); idx = -1
            for i, s in enumerate(subs):
                if (data.get('channel_id') and s.get('channel_id') == data.get('channel_id')) or (s.get('uploader') == data.get('uploader')):
                    idx = i; break
            subbed = False
            if idx != -1: subs.pop(idx)
            else: subs.append({"uploader": data.get("uploader"), "channel_id": data.get("channel_id"), "thumbnail": data.get("thumbnail")}); subbed = True
            f.seek(0); json.dump(subs, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success", "is_subscribed": subbed}
    except: return {"status": "error"}

@app.post("/create_playlist")
def create_playlist(data: dict):
    try:
        name = data.get("name", "").strip()
        if not name: raise HTTPException(status_code=400)
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            pl = json.load(f)
            if name not in pl: pl[name] = []
            f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: raise HTTPException(status_code=500)

@app.delete("/delete_from_playlist/{playlist_name}/{video_id}")
def delete_from_playlist(playlist_name: str, video_id: str):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            pl = json.load(f)
            if playlist_name in pl:
                pl[playlist_name] = [v for v in pl[playlist_name] if v['id'] != video_id]
                f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: raise HTTPException(status_code=500)

@app.delete("/delete_playlist/{playlist_name}")
def delete_playlist(playlist_name: str):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            pl = json.load(f)
            if playlist_name in pl:
                del pl[playlist_name]
                f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: raise HTTPException(status_code=500)

@app.post("/search_playlist")
def search_playlist(data: dict):
    try:
        query = data.get("query", "").lower().strip()
        if not query: return {"results": []}
        
        results = []
        with open(PLAYLISTS_FILE, 'r', encoding='utf-8') as f:
            playlists = json.load(f)
            
            # Split query for fuzzy matching properly
            terms = [t for t in query.split() if t]

            for pl_name, videos in playlists.items():
                for video in videos:
                    # Search target: Title + Uploader
                    text_to_search = (video.get('title', '') + " " + video.get('uploader', '')).lower()
                    
                    # Check if ALL terms match
                    if all(term in text_to_search for term in terms):
                        # Add playlist name to context
                        video_copy = video.copy()
                        video_copy['found_in_playlist'] = pl_name
                        results.append(video_copy)
                        
        return {"results": results}
    except Exception as e:
        print(f"Search Error: {e}")
        return {"results": []}

def is_port_in_use(port):
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

if __name__ == "__main__":
    import uvicorn
    port = 8000
    while is_port_in_use(port):
        port += 1
        if port > 8100: break
    
    local_ip = get_ips()
    print("\n" + "="*50)
    print("   YT-STUDIO - SERVER RUNNING")
    print("="*50)
    print(f"  > Local:   http://localhost:{port}")
    print(f"  > Network: http://{local_ip}:{port}")
    print("="*50 + "\n")
    
    # Ambil status reload dari env (default False jika tidak diset)
    reload_env = os.getenv("RELOAD", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload_env)