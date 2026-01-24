# Loyal Sports Fan

A Chrome extension that hides YouTube videos about your NBA team after a loss. Stay loyal, avoid the pain.

## Features

- **Team Selection**: Support for all 30 NBA teams
- **Smart Filtering**: Hides videos matching team names, abbreviations, and nicknames
- **Configurable Duration**: Choose how long to hide videos after a loss (1-168 hours)
- **Automatic Updates**: Checks game results hourly
- **YouTube Integration**: Works on home page, search results, recommendations, and Shorts
- **API Key Support**: balldontlie.io API key with built-in validation

## Installation

### From Chrome Web Store

[Install from Chrome Web Store](https://chromewebstore.google.com/detail/loyal-sports-fan/iiienlhddfelfmcgmllcceaakkgggmij)

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/paulliwali/loyal-sportsfan.git
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer mode** (toggle in top right)

4. Click **Load unpacked** and select the `loyal-sportsfan` directory

5. Click the extension icon and select your team

## Usage

1. Click the extension icon in your browser toolbar
2. Select your NBA team from the dropdown
3. Set how long you want videos hidden after a loss (default: 24 hours)
4. Enter your [balldontlie.io](https://www.balldontlie.io/) API key and click **Validate** (sign up for free to get a key)
5. Click **Save Settings**

The extension will automatically check your team's latest game result and hide relevant YouTube videos if they lost.

## How It Works

1. **Game Data**: Fetches results from the [balldontlie.io](https://www.balldontlie.io/) NBA API
2. **Keyword Matching**: Each team has associated keywords (name, city, abbreviation, nicknames)
3. **Content Filtering**: Scans YouTube video titles and hides matches when your team lost
4. **Duration Window**: Videos are only hidden for the configured time period after a loss

## Supported Teams

All 30 NBA teams are supported, including:
- Team full names (e.g., "Los Angeles Lakers")
- City names (e.g., "Boston")
- Abbreviations (e.g., "LAL", "BOS")
- Nicknames (e.g., "Dubs" for Warriors, "Sixers" for 76ers)

## Privacy

- No personal data is collected
- Settings are stored locally in your browser
- Only communicates with balldontlie.io for game results

## Development

See [CLAUDE.md](./CLAUDE.md) for development guidelines and architecture details.

## License

MIT
