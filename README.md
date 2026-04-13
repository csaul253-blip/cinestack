# CineStack

> One interface. Every piece of your media stack.

CineStack is a self-hosted streaming platform that replaces the fragmented *arr stack with a single Docker container and a clean, modern UI.

**Browse → Request → Download → Watch. All in one app.**

---

## How It Works

CineStack owns the entire UI and user experience. Three engines run silently in the background — users never touch them directly.

| Layer | Tool | Role |
|-------|------|------|
| UI | CineStack | Everything the user sees |
| Media Server | Jellyfin | Transcoding, streaming, library |
| Indexer | Prowlarr | Finding torrents across trackers |
| Downloader | qBittorrent | Downloading |

---

## Install

### Prerequisites

- Docker
- A running [Jellyfin](https://jellyfin.org) instance with an API key
- A running [Prowlarr](https://prowlarr.com) instance with an API key
- A running [qBittorrent](https://www.qbittorrent.org) instance (local or remote seedbox)

### Single command install

```bash
docker run -d --name cinestack -p 80:80 \
  -v cinestack-data:/var/lib/postgresql/data \
  -v /mnt/media:/mnt/media \
  ghcr.io/homesoftco/cinestack:latest
```

Replace `/mnt/media` with the path to your media folder. Add additional `-v` flags for any other media locations.

### Setup wizard

On first run, navigate to `http://your-server-ip` and the setup wizard will guide you through:

1. Creating your admin account
2. Setting your media storage paths
3. Connecting Jellyfin (URL + API key)
4. Connecting Prowlarr (URL + API key)
5. Connecting your download agent (qBittorrent URL + username + password)

All credentials are stored in the database — nothing is hardcoded.

---

## Features

### Core
- **Movies & TV** — your Jellyfin library with a Netflix-quality browsing UI
- **Requests** — search the full TMDB catalogue, request movies or individual TV seasons
- **Downloads** — live progress, speed, and ETA from qBittorrent with tag-based torrent matching
- **Player** — HLS streaming from Jellyfin with SRT subtitle support and resume playback
- **Settings** — manage all integrations from one place

### Multi-User
- **User accounts** — admin and standard roles with scoped JWT authentication
- **Admin dashboard** — manage users, approve/deny requests, configure auto-accept
- **Per-user features** — continue watching, personal watchlists, PIN lock, parental controls, quality preferences

### Mobile
- **PWA** — installable progressive web app with service worker and mobile-optimized UI
- **iOS app** — native Capacitor build with persistent auth, safe-area support, and HLS playback
- **Push notifications** — VAPID-based notifications for download completion and request updates

### Subtitles
- **SRT scanner** — automatically detects subtitle files alongside media
- **In-player selector** — choose subtitles during playback with live SRT-to-VTT conversion

---

## Tech Stack

- **Frontend:** React + Vite, react-router-dom, Axios, hls.js
- **Backend:** Node.js + Express, PostgreSQL 16, JWT auth (bcryptjs + jsonwebtoken)
- **Container:** Ubuntu 24.04, Nginx, supervisord
- **Metadata:** TMDB API
- **Mobile:** Capacitor (iOS), @capacitor/preferences for persistent storage

---

## Legal

CineStack is software only. It does not host, store, stream, or distribute any media content. Users supply their own download clients, indexers, media server, and storage. The legal position is identical to Sonarr, Radarr, Plex, and Jellyfin.

---

## License

MIT

---

Built by [HomeSoft](https://github.com/homesoftco)
