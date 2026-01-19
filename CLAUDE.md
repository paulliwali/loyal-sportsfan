# CLAUDE.md - Development Guidelines

## Project Overview
Loyal Sports Fan is a Chrome extension that hides YouTube videos about the user's NBA team after a loss. Built with Chrome Manifest V3.

## Architecture

```
loyal-sportsfan/
├── manifest.json          # Extension configuration
├── popup/                 # Settings UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js           # Team data, settings management
├── background/
│   └── service-worker.js  # API calls to balldontlie.io, alarm scheduling
├── content/
│   └── content.js         # YouTube DOM manipulation, video hiding
└── assets/
    └── icons/             # Extension icons (16, 48, 128px)
```

## Key Components

### popup.js
- Contains `NBA_TEAMS` array with all 30 teams, IDs, and keywords
- Manages user settings in `chrome.storage.sync`
- Communicates with service worker via `chrome.runtime.sendMessage`

### service-worker.js
- Fetches game results from `https://api.balldontlie.io/v1`
- Runs hourly check via `chrome.alarms`
- Stores game state in `chrome.storage.local`

### content.js
- Monitors YouTube DOM with MutationObserver
- Hides videos matching team keywords when `lastGameResult === 'loss'`
- Handles YouTube SPA navigation

## Development Commands

```bash
# Load extension in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this directory
```

## API Notes
- balldontlie.io free tier has rate limits
- API key is optional but recommended for higher limits
- Season calculation: October+ = current year, otherwise previous year

## Storage Schema

### chrome.storage.sync
- `selectedTeam`: { id, name, abbreviation, keywords }
- `hideDurationHours`: number (1-168)
- `apiKey`: string (optional)

### chrome.storage.local
- `lastGameResult`: 'win' | 'loss' | 'unknown'
- `lastGameDate`: ISO date string
- `lastGameScore`: formatted score string
- `lastChecked`: ISO timestamp
