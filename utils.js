import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = __dirname;

// --- CONFIGURATION ---
export const CACHE_DIR = path.join(ROOT_DIR, 'cached_videos');
export const META_DIR = path.join(CACHE_DIR, 'metadata');
export const SUB_DIR = path.join(CACHE_DIR, 'subtitles');
export const THUMB_DIR = path.join(CACHE_DIR, 'thumbnails');
export const DATA_DIR = path.join(ROOT_DIR, 'server_data');

export const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
export const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');
export const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

// Ensure directories exist
(async () => {
    await fs.ensureDir(CACHE_DIR);
    await fs.ensureDir(META_DIR);
    await fs.ensureDir(SUB_DIR);
    await fs.ensureDir(THUMB_DIR);
    await fs.ensureDir(DATA_DIR);
})();

// --- YT-DLP QUEUE & DOWNLOAD TRACKING ---
const MAX_CONCURRENT_YT_DLP = 2;
let activeProcesses = 0;
const ytQueue = [];
export const downloadProgress = new Map(); // Store download progress by ID

export const runYtDlp = (args, onProgress = null) => new Promise((resolve, reject) => {
    const execute = () => {
        activeProcesses++;

        // Cek apakah ini perintah dump atau bukan untuk log terminal
        const isDump = args.includes('--dump-json') || args.includes('--dump-single-json');
        if (!isDump) {
            console.log(`\n[YT-DLP] Executing: yt-dlp ${args.filter(a => !a.startsWith('http')).join(' ')}`);
        } else {
            console.log(`[YT-DLP] Fetching metadata...`);
        }

        const p = spawn('yt-dlp', [...args]);
        let so = '', se = '';

        p.stdout.on('data', d => {
            const str = d.toString();
            so += str;

            const trimmed = str.trim();
            const isJson = trimmed.startsWith('{') || trimmed.startsWith('[');
            const isProgress = trimmed.includes('[download]') || trimmed.includes('[info]');

            if (!isDump && !isJson && (isProgress || trimmed.length < 200)) {
                process.stdout.write(str);
            }

            if (onProgress) {
                const match = str.match(/\[download\]\s+(\d+\.?\d+)%/);
                if (match) {
                    onProgress(parseFloat(match[1]));
                }
            }
        });

        p.stderr.on('data', d => {
            const str = d.toString();
            se += str;

            // Filter noise stderr - jangan tampilkan error teknis yang tidak penting
            const isNoise = str.includes('hls') ||
                str.includes('http') ||
                str.includes('WARNING') ||
                str.includes('Extracting URL') ||
                str.includes('Downloading') && str.includes('webpage');

            if (!isNoise && str.trim().length > 0) {
                process.stderr.write(str);
            }
        });

        p.on('close', (code) => {
            activeProcesses--;
            if (ytQueue.length > 0) {
                const next = ytQueue.shift();
                if (next) next();
            }

            if (code === 0 || (code === 1 && so.trim())) resolve(so);
            else reject(new Error(se || 'yt-dlp failed'));
        });
    };

    if (activeProcesses < MAX_CONCURRENT_YT_DLP) {
        execute();
    } else {
        ytQueue.push(execute);
    }
});

export const formatSize = (bytes) => {
    if (!bytes) return "";
    let s = bytes;
    for (const unit of ['B', 'KB', 'MB', 'GB']) {
        if (s < 1024) return `${s.toFixed(1)}${unit}`;
        s /= 1024;
    }
    return `${s.toFixed(1)}TB`;
};

export const formatDuration = (d) => {
    if (typeof d === 'number') {
        return Math.floor(d / 60) + ':' + (d % 60).toString().padStart(2, '0');
    }
    return d;
}

export const formatViews = (v) => {
    if (!v) return '';
    if (v > 1000000) return (v / 1000000).toFixed(1) + 'jt';
    if (v > 1000) return (v / 1000).toFixed(0) + 'rb';
    return v + '';
}
