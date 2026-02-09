import { html } from 'hono/html';
import { Layout } from './layout.js';

export const Playlists = (props) => {
    const { results, activePage, playingVideo, subscriptions } = props;

    return Layout({
        title: 'Koleksi Anda',
        activePage: 'playlist',
        playingVideo,
        subscriptions,
        children: html`
            <div style="margin-bottom: 30px;" x-data="{ 
                newName: '',
                async createPlaylist() {
                    if (!this.newName.trim()) return showToast('Nama playlist tidak boleh kosong', 'error');
                    const res = await fetch('/create_playlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: this.newName })
                    });
                    if (res.ok) {
                        location.reload();
                    } else {
                        showToast('Gagal membuat playlist', 'error');
                    }
                }
            }">
                <h2 style="font-size: 1.5rem; margin-bottom: 20px;">Koleksi Anda</h2>
                <div style="background: var(--surface); padding: 5px 5px 5px 15px; border-radius: 30px; display: flex; gap: 10px; align-items: center; border: 1px solid rgba(255,255,255,0.05); max-width: 400px;">
                    <i class="icon icon-plus" style="color: var(--primary); opacity: 0.7;"></i>
                    <input type="text" x-model="newName" placeholder="Buat playlist baru..."
                        @keydown.enter="createPlaylist()"
                        style="background: none; border: none; outline: none; color: white; flex: 1; font-family: inherit; font-size: 0.9rem; height: 40px;">
                    <button @click="createPlaylist()"
                        style="background: var(--primary); color: white; border: none; padding: 0 20px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; height: 34px; cursor: pointer;">Tambah</button>
                </div>
            </div>

            <div class="grid-container">
                ${results && Object.keys(results).length > 0 ? html`
                    ${Object.keys(results).map(name => {
            const videos = results[name];
            return html`
                            <div class="playlist-row" onclick="navigate('/playlists/${encodeURIComponent(name)}')">
                                <div class="playlist-icon">
                                    <i class="icon icon-list"></i>
                                </div>
                                <div class="playlist-details">
                                    <h3>${name}</h3>
                                    <p>${videos.length} Video</p>
                                </div>
                                <i class="icon icon-chevron-right" style="color: var(--text-dim); font-size: 0.8rem; opacity: 0.5;"></i>
                            </div>
                        `;
        })}
                ` : html`
                    <div style="text-align: center; padding: 60px 20px; opacity: 0.3; grid-column: 1 / -1;">
                        <i class="icon icon-folder" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                        <p>Belum ada playlist.</p>
                    </div>
                `}
            </div>

            <style>
                 .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                @media (min-width: 600px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }

                .playlist-row {
                    background: var(--surface);
                    padding: 20px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .playlist-row:hover {
                    background: var(--surface-accent);
                    transform: translateY(-2px);
                }

                .playlist-icon {
                    width: 50px;
                    height: 50px;
                    background: rgba(88, 101, 242, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    font-size: 1.2rem;
                }

                .playlist-details {
                    flex: 1;
                }

                .playlist-details h3 {
                    margin: 0;
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: white;
                }

                .playlist-details p {
                    margin: 4px 0 0;
                    font-size: 0.8rem;
                    color: var(--text-dim);
                }
            </style>
        `
    });
};
