# 🎵 Omed Player

Omed Player is a premium, high-performance web-based audio and video player designed for the modern user. Built with a focus on aesthetics, speed, and cloud-native features, Omed provides a seamless experience across music, podcasts, and video.

![Omed Player Architecture](https://img.shields.io/badge/Architecture-Cloud--Native-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-orange?style=flat-square)

## ✨ Key Features

- **☁️ Cloud Sync**: Effortless synchronization of your playlists and settings with **Google Drive**.
- **🎙️ Podcast Explorer**: Native XML-based RSS parser (no external limits!) with smart AI-powered summaries.
- **🕒 Listening History**: Detailed logging of your activities with instant replay capabilities.
- **🎨 Dynamic Themes**: Choose from 7 premium themes (Aurora, Ocean, Cyberpunk, Midnight, Peach, Forest, Sunset).
- **📱 Responsive Design**: Fully optimized for Desktop and Mobile with a dedicated navigation drawer.
- **⚡ Performance**: Built with Vite and Zustand for ultra-fast state management and loading.

## 🚀 Tech Stack

- **Framework**: React 19 (Vite)
- **Styling**: TailwindCSS 4
- **State Management**: Zustand (with Persistence)
- **Audio Engine**: Howler.js
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **API integrations**: Google Drive (Storage), iTunes (Podcasts), Gemini (AI Summaries)

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- A Google Cloud Project (for Drive Sync) - [Setup Guide](#google-drive-setup)
- A Gemini API Key (optional, for AI features)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rudolf-Staline/Omed-Player.git
   cd Omed-Player
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GEMINI_API_KEY=your_gemini_api_key  # Optional
   ```

4. **Run in development mode**:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## 📂 Project Structure

```
src/
├── components/          # Shared UI components
│   ├── BottomPlayer.tsx # Audio player controls
│   ├── Layout.tsx       # Main layout wrapper
│   ├── QueuePanel.tsx  # Playback queue management
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── SyncStatus.tsx  # Cloud sync indicator
├── core/
│   └── audio_engine.ts # Howler.js audio engine
├── features/            # Feature modules
│   ├── auth/           # Google authentication
│   ├── drive/          # Google Drive integration
│   ├── history/        # Listening history
│   ├── music/          # Music library & playback
│   ├── playlists/      # Playlist management
│   ├── podcasts/       # Podcast discovery & subscriptions
│   ├── settings/       # User preferences
│   └── video/          # Video player
├── store/              # Zustand state stores
│   ├── useAuthStore.ts
│   ├── useFavoritesStore.ts
│   ├── useHistoryStore.ts
│   ├── usePlayerStore.ts
│   ├── usePlaylistStore.ts
│   ├── usePodcastStore.ts
│   └── useSettingsStore.ts
├── types/               # TypeScript type declarations
└── utils/              # Utility functions
    ├── auroraSync.ts   # Google Drive sync
    ├── fileScanner.ts  # Audio metadata extraction
    ├── geminiApi.ts    # AI features
    ├── googleDriveApi.ts
    └── rssParser.ts    # RSS/Atom feed parser
```

## 🎮 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID for Drive sync |
| `VITE_GEMINI_API_KEY` | No | Gemini API key for AI features |

### Google Drive Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://your-domain.com` (for production)
7. Copy the Client ID and add it to your `.env` file

## 📋 Known Limitations (V1)

- **Local Files**: Requires browsers with File System Access API (Chrome/Edge). Firefox/Safari support is limited.
- **Google Drive**: Requires valid OAuth setup. Without credentials, the app works but sync features are disabled.
- **AI Features**: Running in mock mode without Gemini API key. Summaries return placeholder responses.
- **Video Player**: Basic functionality only. Supports local file playback via drag & drop.
- **Podcast Discovery**: Uses iTunes Search API. Some podcasts may have missing feed URLs.
- **Mobile**: Core playback features work, but some drag-and-drop interactions require desktop.

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Created by [Rudolf-Staline](https://github.com/Rudolf-Staline)*
