from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import os

app = FastAPI()

# Izinkan akses browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoRequest(BaseModel):
    query: str

@app.get("/", response_class=HTMLResponse)
async def get_index():
    if not os.path.exists("index.html"):
        return "<h1>Error: File index.html tidak ditemukan</h1>"
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/extract")
async def extract_video(video_req: VideoRequest):
    search_query = video_req.query.strip()
    
    # Ambil 20 hasil pencarian dengan mode cepat
    if not search_query.startswith(("http://", "https://")):
        search_query = f"ytsearch20:{search_query}"
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': 'in_playlist', # Mode instan
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_query, download=False)
            results = []

            entries = info.get('entries', [info])

            for entry in entries:
                if entry:
                    video_id = entry.get('id')
                    results.append({
                        "title": entry.get('title'),
                        "thumbnail": entry.get('thumbnails')[0]['url'] if entry.get('thumbnails') else entry.get('thumbnail'),
                        "uploader": entry.get('uploader') or entry.get('channel'),
                        "duration": entry.get('duration'),
                        "id": video_id,
                        "views": entry.get('view_count', 0)
                    })

            return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/get_stream")
async def get_stream(video_id: str):
    """Fungsi khusus untuk mengambil link streaming saat video di-klik"""
    ydl_opts = {
        'format': 'best',
        'quiet': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            return {"stream_url": info.get('url')}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)