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
    port = 8000 # Default port
    
    print("\n" + "="*50)
    print("   YT-STUDIO - SERVER RUNNING")
    print("="*50)
    print(f"  > Localhost  : http://localhost:{port}")
    if local_ip != "Unknown":
        print(f"  > Network IP : http://{local_ip}:{port}")
    print("="*50 + "\n")
    yield

app = FastAPI(lifespan=lifespan)

# Folder penyimpanan
CACHE_DIR = "cached_videos"
META_DIR = os.path.join(CACHE_DIR, "metadata")
SUB_DIR = os.path.join(CACHE_DIR, "subtitles")
DATA_DIR = "server_data"
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
SEARCH_HISTORY_FILE = os.path.join(DATA_DIR, "search_history.json")
PLAYLISTS_FILE = os.path.join(DATA_DIR, "playlists.json")

for d in [CACHE_DIR, META_DIR, SUB_DIR, DATA_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

# Initialize files if not exists
for f_path in [HISTORY_FILE, SEARCH_HISTORY_FILE, PLAYLISTS_FILE]:
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

def download_video_and_meta(video_id: str, video_info: dict):
    base_name = os.path.join(CACHE_DIR, video_id)
    final_mp4 = base_name + ".mp4"
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    
    # Pre-download subtitles if any in background
    # Since this is a thread, we use a new event loop or sync version
    if video_info.get("subtitles"):
        # We'll handle this in refresh_meta_task which is more flexible
        pass

    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
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
        'ignoreerrors': True, # Lanjutkan jika ada video yang error dalam list
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_query, download=False)
            results = []
            entries = info.get('entries', [info])
            
            # Fallback data dari playlist/channel jika video individual tidak punya uploader
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

            return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def extract_subtitles(info: dict):
    """Helper to extract subtitles from yt-dlp info dict"""
    subtitles = []
    captions = info.get('subtitles', {})
    auto_captions = info.get('automatic_captions', {})
    
    # Check Manual Subtitles first
    for lang, lang_info in captions.items():
        vtt_sub = next((s['url'] for s in lang_info if s.get('ext') == 'vtt'), None)
        if vtt_sub:
            subtitles.append({"lang": lang, "url": vtt_sub, "label": lang})
    
    # If no manual subs, check Auto-generated
    if not subtitles:
        for lang, lang_info in auto_captions.items():
            vtt_sub = next((s['url'] for s in lang_info if s.get('ext') == 'vtt'), None)
            if vtt_sub:
                subtitles.append({"lang": lang, "url": vtt_sub, "label": lang})
    
    return subtitles

async def refresh_meta_task(video_id: str, meta_path: str):
    """Refreshes metadata (subtitles, views) and downloads subs locally"""
    try:
        print(f"Starting background metadata refresh for {video_id}...")
        ydl_opts = {'format': 'best', 'quiet': True, 'writesubtitles': True, 'allsubtitles': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Pengecekan cepat metadata tanpa download video
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
            
            remote_subs = extract_subtitles(info)
            # Download subs locally
            meta["subtitles"] = await download_subs_local(video_id, remote_subs)
            meta["views"] = info.get('view_count', meta.get('views', 0))
            if not meta.get('uploader') and info.get('uploader'):
                meta["uploader"] = info.get('uploader')
            
            with open(meta_path, 'w', encoding='utf-8') as fw:
                json.dump(meta, fw, ensure_ascii=False, indent=4)
            print(f"Background metadata refresh COMPLETED for {video_id}")
    except Exception as e:
        print(f"Background refresh failed for {video_id}: {e}")

@app.get("/get_stream")
async def get_stream(video_id: str, background_tasks: BackgroundTasks):
    local_file = os.path.join(CACHE_DIR, f"{video_id}.mp4")
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    
    # 1. Check if Offline
    if os.path.exists(local_file) and os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
                
            # TRIGGER ASYNC REFRESH if data is incomplete (no subs or 0 views)
            if "subtitles" not in meta or meta.get("views", 0) == 0:
                background_tasks.add_task(refresh_meta_task, video_id, meta_path)
            
            # Filter subs: Only keep those that actually exist on disk
            final_subs = []
            for s in meta.get('subtitles', []):
                # Extra check for physical existence if it's a local path
                if s['url'].startswith('/subs/'):
                    file_part = s['url'].replace('/subs/', '')
                    if os.path.exists(os.path.join(SUB_DIR, file_part)):
                        final_subs.append(s)
                else:
                    # Remote subs (if background download hasn't finished yet/failed)
                    # We might want to skip these as per user request to ensure cached only
                    pass
            
            return {
                "stream_url": f"/offline/{video_id}.mp4", 
                "is_offline": True, 
                "status": "playing_offline",
                "title": meta.get('title', 'Offline Video'),
                "subtitles": final_subs
            }
        except Exception as e:
            return {"stream_url": f"/offline/{video_id}.mp4", "is_offline": True, "status": "playing_offline"}
    
    # 2. Online Stream & Download in Background
    # format 'best' might sometimes fail to give direct URL, fallback to better options
    ydl_opts = {
        'format': 'best/bestvideo+bestaudio', 
        'quiet': True, 
        'no_warnings': True,
        'writesubtitles': True, 
        'allsubtitles': True
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Extracting online stream for {video_id}...")
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            # Subtitles check
            subtitles = extract_subtitles(info)
            
            # Stream URL priority
            stream_url = info.get('url')
            if not stream_url and info.get('formats'):
                # Try to find a playable format if 'url' is missing at top level
                formats = [f for f in info['formats'] if f.get('url') and (f.get('acodec') != 'none' or f.get('vcodec') != 'none')]
                if formats:
                    stream_url = formats[-1]['url'] # Usually best format is at the end

            if not stream_url:
                raise Exception("Tidak dapat menemukan stream URL")

            video_info = {
                "id": video_id,
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "uploader": info.get('uploader') or info.get('channel'),
                "channel_id": info.get('channel_id') or info.get('uploader_id'),
                "duration": info.get('duration'),
                "views": info.get('view_count', 0),
                "is_offline": True,
                "subtitles": subtitles
            }
            
            threading.Thread(target=download_video_and_meta, args=(video_id, video_info), daemon=True).start()
            return {
                "stream_url": stream_url, 
                "is_offline": False, 
                "status": "fetching_to_offline",
                "subtitles": subtitles,
                "title": info.get('title')
            }
    except Exception as e:
        print(f"CRITICAL: get_stream failed for {video_id}: {e}")
        raise HTTPException(status_code=400, detail=f"Gagal mengambil stream: {str(e)}")

@app.get("/list_offline")
async def list_offline():
    videos = []
    if os.path.exists(META_DIR):
        for filename in sorted(os.listdir(META_DIR), reverse=True):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(META_DIR, filename), 'r', encoding='utf-8') as f:
                        v = json.load(f)
                        if os.path.exists(os.path.join(CACHE_DIR, f"{v['id']}.mp4")):
                            videos.append(v)
                except:
                    continue
    return {"results": videos}

@app.delete("/delete_offline/{video_id}")
async def delete_offline(video_id: str):
    try:
        target_files = [
            os.path.join(CACHE_DIR, f"{video_id}.mp4"),
            os.path.join(CACHE_DIR, f"{video_id}.mp4.part"),
            os.path.join(META_DIR, f"{video_id}.json")
        ]
        for p in target_files:
            if os.path.exists(p): os.remove(p)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save_history")
async def save_history(item: HistoryItem):
    try:
        with open(HISTORY_FILE, 'r+', encoding='utf-8') as f:
            history = json.load(f)
            history = [h for h in history if h.get('id') != item.id]
            history.insert(0, item.dict())
            history = history[:100]
            f.seek(0)
            json.dump(history, f, ensure_ascii=False, indent=4)
            f.truncate()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list_history")
async def list_history():
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            return {"results": json.load(f)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_history/{video_id}")
async def delete_history(video_id: str):
    try:
        with open(HISTORY_FILE, 'r+', encoding='utf-8') as f:
            history = json.load(f)
            history = [h for h in history if h.get('id') != video_id]
            f.seek(0)
            json.dump(history, f, ensure_ascii=False, indent=4)
            f.truncate()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear_history")
async def clear_history():
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- SEARCH SUGGESTIONS & HISTORY ---

@app.get("/search_suggestions")
async def get_suggestions(q: str):
    if not q:
        return {"suggestions": []}
    
    url = f"https://suggestqueries.google.com/complete/search?client=firefox&q={q}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            data = response.json()
            return {"suggestions": data[1]}
    except Exception as e:
        return {"suggestions": []}

@app.get("/list_search_history")
async def list_search_history():
    try:
        with open(SEARCH_HISTORY_FILE, 'r', encoding='utf-8') as f:
            return {"results": json.load(f)}
    except:
        return {"results": []}

@app.post("/save_search_history")
async def save_search_history(req: SearchHistoryRequest):
    query = req.query.strip()
    if not query:
        return {"status": "ignored"}
    
    try:
        with open(SEARCH_HISTORY_FILE, 'r+', encoding='utf-8') as f:
            history = json.load(f)
            history = [h for h in history if h != query]
            history.insert(0, query)
            history = history[:15]
            f.seek(0)
            json.dump(history, f, ensure_ascii=False, indent=4)
            f.truncate()
        return {"status": "success"}
    except:
        return {"status": "error"}

@app.delete("/delete_search_history")
async def delete_search_history(q: str):
    try:
        with open(SEARCH_HISTORY_FILE, 'r+', encoding='utf-8') as f:
            history = json.load(f)
            history = [h for h in history if h != q]
            f.seek(0)
            json.dump(history, f, ensure_ascii=False, indent=4)
            f.truncate()
        return {"status": "success"}
    except:
        return {"status": "error"}

# --- PLAYLISTS ---

@app.get("/list_playlists")
async def list_playlists():
    try:
        if not os.path.exists(PLAYLISTS_FILE):
            return {}
        with open(PLAYLISTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

@app.post("/add_to_playlist")
async def add_to_playlist(req: PlaylistVideoRequest):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            playlists = json.load(f)
            name = req.playlist_name.strip()
            if not name:
                raise HTTPException(status_code=400, detail="Nama playlist tidak boleh kosong")
                
            if name not in playlists:
                playlists[name] = []
            
            # Prevent duplicates
            playlists[name] = [v for v in playlists[name] if v['id'] != req.video.id]
            playlists[name].insert(0, req.video.dict())
            
            f.seek(0)
            json.dump(playlists, f, ensure_ascii=False, indent=4)
            f.truncate()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create_playlist")
async def create_playlist(data: dict):
    try:
        name = data.get("name", "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Nama playlist tidak boleh kosong")
            
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            playlists = json.load(f)
            if name not in playlists:
                playlists[name] = []
            f.seek(0)
            json.dump(playlists, f, ensure_ascii=False, indent=4)
            f.truncate()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_from_playlist/{playlist_name}/{video_id}")
async def delete_from_playlist(playlist_name: str, video_id: str):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            playlists = json.load(f)
            if playlist_name in playlists:
                playlists[playlist_name] = [v for v in playlists[playlist_name] if v['id'] != video_id]
                f.seek(0)
                json.dump(playlists, f, ensure_ascii=False, indent=4)
                f.truncate()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_playlist/{playlist_name}")
async def delete_playlist(playlist_name: str):
    try:
        with open(PLAYLISTS_FILE, 'r+', encoding='utf-8') as f:
            playlists = json.load(f)
            if playlist_name in playlists:
                del playlists[playlist_name]
                f.seek(0)
                json.dump(playlists, f, ensure_ascii=False, indent=4)
                f.truncate()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)