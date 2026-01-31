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

app = FastAPI()

# Folder penyimpanan
CACHE_DIR = "cached_videos"
META_DIR = os.path.join(CACHE_DIR, "metadata")
for d in [CACHE_DIR, META_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

# Akses file offline
app.mount("/offline", StaticFiles(directory=CACHE_DIR), name="offline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoRequest(BaseModel):
    query: str
    offset: int = 1

@app.get("/", response_class=HTMLResponse)
async def get_index():
    if not os.path.exists("index.html"):
        return "<h1>Error: File index.html tidak ditemukan</h1>"
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

def download_video_and_meta(video_id: str, video_info: dict):
    """Proses download di background. Setelah selesai baru buat metadata json."""
    # Kita tidak menambahkan .mp4 atau .part secara manual pada outtmpl
    # Kita biarkan yt-dlp yang menentukannya agar tidak ada double extension
    base_name = os.path.join(CACHE_DIR, video_id)
    final_mp4 = base_name + ".mp4"
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    
    # yt-dlp akan mendownload ke base_name.mp4 secara default jika formatnya mp4
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': base_name + ".%(ext)s", # Gunakan formula ini agar yt-dlp yang handle extension
        'quiet': True,
        'no_warnings': True,
        'merge_output_format': 'mp4',
    }
    
    try:
        # Jika file sudah ada tapi metadata hilang, langsung buat metadata
        if os.path.exists(final_mp4):
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(video_info, f, ensure_ascii=False, indent=4)
            return

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
            
            # Setelah download sukses, simpan metadata
            # Metadata inilah yang jadi penanda bahwa video siap ditonton offline
            if os.path.exists(final_mp4):
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump(video_info, f, ensure_ascii=False, indent=4)
                print(f"Berhasil fetch offline: {video_id}")
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
        'extract_flat': 'in_playlist',
        'playliststart': offset,
        'playlistend': offset + limit - 1,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_query, download=False)
            results = []
            entries = info.get('entries', [info])

            for entry in entries:
                if entry:
                    video_id = entry.get('id')
                    # Video dianggap offline HANYA jika .mp4 DAN .json sudah ada
                    is_ready = os.path.exists(os.path.join(CACHE_DIR, f"{video_id}.mp4")) and \
                               os.path.exists(os.path.join(META_DIR, f"{video_id}.json"))
                    
                    results.append({
                        "title": entry.get('title'),
                        "thumbnail": entry.get('thumbnails')[0]['url'] if entry.get('thumbnails') else entry.get('thumbnail'),
                        "uploader": entry.get('uploader') or entry.get('channel'),
                        "duration": entry.get('duration'),
                        "id": video_id,
                        "views": entry.get('view_count', 0),
                        "is_offline": is_ready
                    })

            return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/get_stream")
async def get_stream(video_id: str, background_tasks: BackgroundTasks):
    local_file = os.path.join(CACHE_DIR, f"{video_id}.mp4")
    meta_path = os.path.join(META_DIR, f"{video_id}.json")
    
    # Jika sudah lengkap, putar offline
    if os.path.exists(local_file) and os.path.exists(meta_path):
        return {"stream_url": f"/offline/{video_id}.mp4", "is_offline": True, "status": "playing_offline"}
    
    # Jika belum, ambil stream remote dan trigger download di background
    ydl_opts = {'format': 'best', 'quiet': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            video_info = {
                "id": video_id,
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "uploader": info.get('uploader') or info.get('channel'),
                "duration": info.get('duration'),
                "is_offline": True
            }
            
            threading.Thread(target=download_video_and_meta, args=(video_id, video_info), daemon=True).start()
            
            return {"stream_url": info.get('url'), "is_offline": False, "status": "fetching_to_offline"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
        # Bersihkan file mp4, metadata, dan file part sisa yt-dlp jika ada
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)