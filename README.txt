MyAiTeacher — PWA v5 (Pages-ready)
==================================

What this is
------------
An installable, offline-capable web app with:
- 36-module curriculum, Labs, Models connector, TF‑IDF RAG, Prompts, Quizzes
- Future Radar, Backup/Restore, and **auto-update content** via `/updates/feed.json`
- Black/white/red clean theme

Quick Start on Mac (local test)
-------------------------------
1. Open Terminal in this folder.
2. Run:  python3 -m http.server 8080
3. Open Safari/Chrome to:  http://localhost:8080
4. In Safari: Share → Add to Dock (or iPad: Add to Home Screen). Works offline.

Publish to GitHub Pages (one-time setup)
----------------------------------------
1. Create a new public repo (e.g., my-ai-teacher).
2. Upload **all files** from this folder (drag/drop).
3. In the repo: Settings → Pages → Source: "Deploy from a branch", Branch: main, Folder: / → Save.
4. Visit: https://<your-username>.github.io/my-ai-teacher
5. On iPad/iPhone: open that URL in Safari → Share → **Add to Home Screen**.

How updates work
----------------
- **App code/UI**: push new files to the repo → users refresh → service worker updates cached files (stale‑while‑revalidate).
- **Content**: edit `updates/feed.json` (or point the Update Center to another feed URL). On app load or "Fetch & Merge", new modules/resources are merged in without a rebuild.

Model connector
---------------
Use the "Models" tab to hit an OpenAI-compatible endpoint:
- Hosted: paste your provider URL + API key.
- Local: run LM Studio/Ollama with an OpenAI-style server on your Mac and point to `http://localhost:11434/v1/chat/completions` (example). Enable CORS or serve from the same origin.

Your data
---------
- Progress, notes, quiz scores live in the browser (localStorage). Use the Backup tab to export/import as JSON.

Generated: 2025-08-13
