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
    local_ip = get_ips()
    # The port display will be handled by the launcher or the initial uvicorn log
    # For programmatic access to current port, we can't easily get it here during startup before bind
    print("\n" + "="*50)
    print("   YT-STUDIO - SERVER RUNNING")
    print("="*50)
    print(f"  > Network IP detected: {local_ip}")
    print("="*50 + "\n")
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
            print(f"Threaded thumbnail download failed for {video_id}: {e}")

    ydl_opts = {
        # Prioritize 360p or 480p (height <= 480) to save space and bandwidth
        'format': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[ext=mp4]/best',
        'outtmpl': base_name + ".%(ext)s",
        'quiet': True,
        'no_warnings': True,
        'merge_output_format': 'mp4',
    }
    
    try:
        if os.path.exists(final_mp4):
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(video_info, f, ensure_ascii=False, indent=4)
            return

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
            if os.path.exists(final_mp4):
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump(video_info, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Background task gagal untuk {video_id}: {e}")

@app.post("/extract")
async def extract_video(video_req: VideoRequest):
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
                    is_ready = os.path.exists(os.path.join(CACHE_DIR, f"{video_id}.mp4")) and \
                               os.path.exists(os.path.join(META_DIR, f"{video_id}.json"))
                    
                    results.append({
                        "title": entry.get('title'),
                        "thumbnail": entry.get('thumbnails')[0]['url'] if entry.get('thumbnails') else entry.get('thumbnail'),
                        "uploader": entry.get('uploader') or entry.get('channel') or base_uploader,
                        "channel_id": entry.get('channel_id') or entry.get('uploader_id') or base_channel_id,
                        "duration": entry.get('duration'),
                        "id": video_id,
                        "views": entry.get('view_count', 0),
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
        'zh': 'Chinese', 'zh-Hans': 'Chinese (Simplified)', 'zh-Hant': 'Chinese (Traditional)',
        'zh-TW': 'Chinese (Taiwan)', 'zh-HK': 'Chinese (Hong Kong)',
        'fr': 'French', 'es': 'Spanish', 'de': 'German', 'ru': 'Russian',
        'it': 'Italian', 'pt': 'Portuguese', 'vi': 'Vietnamese', 'th': 'Thai',
        'tr': 'Turkish', 'ar': 'Arabic', 'hi': 'Hindi', 'ms': 'Malay',
        'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish', 'da': 'Danish',
        'fi': 'Finnish', 'no': 'Norwegian', 'cs': 'Czech', 'el': 'Greek',
        'hu': 'Hungarian', 'ro': 'Romanian', 'sk': 'Slovak', 'uk': 'Ukrainian'
    }
    clean_code = lang_code.split(' ')[0].split('-')[0].lower()
    name = mapping.get(lang_code, mapping.get(clean_code, lang_code))
    for tag in ["(Manual)", "(Auto)", "[auto]", "manual"]:
        name = name.replace(tag, "").strip()
    return name

def extract_subtitles(info: dict):
    """Helper to extract subtitles from yt-dlp info dict"""
    subtitles = []
    captions = info.get('subtitles', {})
    auto_captions = info.get('automatic_captions', {})
    
    for lang, lang_info in captions.items():
        vtt_sub = next((s['url'] for s in lang_info if s.get('ext') == 'vtt'), None)
        if vtt_sub:
            subtitles.append({"lang": lang, "url": vtt_sub, "label": get_lang_name(lang)})
    
    if not subtitles:
        for lang, lang_info in auto_captions.items():
            vtt_sub = next((s['url'] for s in lang_info if s.get('ext') == 'vtt'), None)
            if vtt_sub:
                subtitles.append({"lang": lang, "url": vtt_sub, "label": get_lang_name(lang)})
    
    return subtitles

async def refresh_meta_task(video_id: str, meta_path: str):
    """Refreshes metadata (subtitles, views, thumbnails) and downloads them locally"""
    try:
        ydl_opts = {'format': 'best', 'quiet': True, 'writesubtitles': True, 'allsubtitles': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
            
            remote_subs = extract_subtitles(info)
            meta["subtitles"] = await download_subs_local(video_id, remote_subs)
            meta["views"] = info.get('view_count', meta.get('views', 0))
            if not meta.get('channel_id') and info.get('channel_id'):
                meta["channel_id"] = info.get('channel_id') or info.get('uploader_id')
            
            remote_thumb = info.get('thumbnail') or meta.get('thumbnail_remote')
            if remote_thumb and remote_thumb.startswith('http'):
                meta["thumbnail_remote"] = remote_thumb
                local_url = await download_thumbnail_local(video_id, remote_thumb)
                if local_url.startswith('/offline/'):
                    meta["thumbnail"] = local_url
            
            with open(meta_path, 'w', encoding='utf-8') as fw:
                json.dump(meta, fw, ensure_ascii=False, indent=4)
            
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
async def get_stream(video_id: str, background_tasks: BackgroundTasks):
    local_file = os.path.join(CACHE_DIR, f"{video_id}.mp4")
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    
    if os.path.exists(local_file) and os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
            
            is_thumb_remote = meta.get("thumbnail", "").startswith("http")
            if "subtitles" not in meta or meta.get("views", 0) == 0 or is_thumb_remote or not meta.get("channel_id"):
                background_tasks.add_task(refresh_meta_task, video_id, meta_path)
            
            final_subs = []
            for s in meta.get('subtitles', []):
                s['label'] = get_lang_name(s['label'] if ' ' not in s['label'] else s['lang'])
                if s['url'].startswith('/subs/'):
                    file_part = s['url'].replace('/subs/', '')
                    if os.path.exists(os.path.join(SUB_DIR, file_part)):
                        final_subs.append(s)
            
            return {
                "stream_url": f"/offline/{video_id}.mp4", 
                "is_offline": True, 
                "status": "playing_offline",
                "title": meta.get('title', 'Offline Video'),
                "thumbnail": meta.get('thumbnail', ''),
                "uploader": meta.get('uploader', 'Unknown Channel'),
                "channel_id": meta.get('channel_id', ''),
                "duration": meta.get('duration', 0),
                "views": meta.get('views', 0),
                "subtitles": final_subs
            }
        except:
            return {"stream_url": f"/offline/{video_id}.mp4", "is_offline": True, "status": "playing_offline"}
    
    ydl_opts = {'format': 'best/bestvideo+bestaudio', 'quiet': True, 'no_warnings': True, 'writesubtitles': True, 'allsubtitles': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            subtitles = extract_subtitles(info)
            stream_url = info.get('url')
            if not stream_url and info.get('formats'):
                formats = [f for f in info['formats'] if f.get('url') and (f.get('acodec') != 'none' or f.get('vcodec') != 'none')]
                if formats: stream_url = formats[-1]['url']

            if not stream_url: raise Exception("Tidak dapat menemukan stream URL")

            video_info = {
                "id": video_id, "title": info.get('title'), "thumbnail": info.get('thumbnail'),
                "uploader": info.get('uploader') or info.get('channel'),
                "channel_id": info.get('channel_id') or info.get('uploader_id'),
                "duration": info.get('duration'), "views": info.get('view_count', 0),
                "is_offline": True, "subtitles": subtitles
            }
            threading.Thread(target=download_video_and_meta, args=(video_id, video_info), daemon=True).start()
            return {
                "stream_url": stream_url, "is_offline": False, "status": "fetching_to_offline",
                "subtitles": subtitles, "title": info.get('title'), "uploader": video_info['uploader'],
                "channel_id": video_info['channel_id'], "duration": video_info['duration'], "views": video_info['views']
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal mengambil stream: {str(e)}")

@app.get("/get_video_meta/{video_id}")
async def get_video_meta(video_id: str):
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f: return json.load(f)
        except: pass
    return {}

@app.get("/list_offline")
async def list_offline():
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
async def delete_offline(video_id: str):
    try:
        for p in [os.path.join(CACHE_DIR, f"{video_id}.mp4"), os.path.join(CACHE_DIR, f"{video_id}.mp4.part"), os.path.join(META_DIR, f"{video_id}.json")]:
            if os.path.exists(p): os.remove(p)
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/save_history")
async def save_history(item: HistoryItem):
    if item.duration == 0 and item.views == 0: return {"status": "ignored"}
    try:
        with open(HISTORY_FILE, 'r+', encoding='utf-8') as f:
            history = json.load(f)
            history = [h for h in history if h.get('id') != item.id]
            history.insert(0, item.dict()); history = history[:100]
            f.seek(0); json.dump(history, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/list_history")
async def list_history():
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {"results": [h for h in data if not (h.get('duration') == 0 and h.get('views', 0) == 0)]}
    except: return {"results": []}

@app.delete("/delete_history/{video_id}")
async def delete_history(video_id: str):
    try:
        with open(HISTORY_FILE, 'r+', encoding='utf-8') as f:
            history = json.load(f); history = [h for h in history if h.get('id') != video_id]
            f.seek(0); json.dump(history, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: raise HTTPException(status_code=500)

@app.post("/clear_history")
async def clear_history():
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
async def list_search_history():
    try:
        with open(SEARCH_HISTORY_FILE, 'r', encoding='utf-8') as f: return {"results": json.load(f)}
    except: return {"results": []}

@app.post("/save_search_history")
async def save_search_history(req: SearchHistoryRequest):
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
async def delete_search_history(q: str):
    try:
        with open(SEARCH_HISTORY_FILE, 'r+', encoding='utf-8') as f:
            hist = json.load(f); hist = [h for h in hist if h != q]
            f.seek(0); json.dump(hist, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: return {"status": "error"}

@app.get("/list_playlists")
async def list_playlists():
    try:
        with open(PLAYLISTS_FILE, 'r', encoding='utf-8') as f: return json.load(f)
    except: return {}

@app.post("/add_to_playlist")
async def add_to_playlist(req: PlaylistVideoRequest):
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
async def update_playlist_meta(req: PlaylistVideoRequest):
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
async def update_playlist_channel_by_uploader(data: dict):
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
async def list_subscriptions():
    try:
        with open(SUBSCRIPTIONS_FILE, 'r', encoding='utf-8') as f: return {"results": json.load(f)}
    except: return {"results": []}

@app.post("/toggle_subscription")
async def toggle_subscription(data: dict):
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
async def create_playlist(data: dict):
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
async def delete_from_playlist(playlist_name: str, video_id: str):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            pl = json.load(f)
            if playlist_name in pl:
                pl[playlist_name] = [v for v in pl[playlist_name] if v['id'] != video_id]
                f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: raise HTTPException(status_code=500)

@app.delete("/delete_playlist/{playlist_name}")
async def delete_playlist(playlist_name: str):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            pl = json.load(f)
            if playlist_name in pl:
                del pl[playlist_name]
                f.seek(0); json.dump(pl, f, ensure_ascii=False, indent=4); f.truncate()
        return {"status": "success"}
    except: raise HTTPException(status_code=500)

def is_port_in_use(port):
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

if __name__ == "__main__":
    import uvicorn
    port = 8000
    while is_port_in_use(port):
        port += 1
        if port > 8010: break
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)