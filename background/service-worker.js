// Loyal Sports Fan - Background Service Worker
// Handles NBA game result checking via API

const API_BASE = 'https://api.balldontlie.io/v1';

// Check game results periodically (every hour)
chrome.alarms.create('checkGameResult', { periodInMinutes: 60 });

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkGameResult') {
    await checkLastGame();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkGame') {
    checkLastGame()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Check last game result for selected team
async function checkLastGame() {
  const { selectedTeam, apiKey } = await chrome.storage.sync.get(['selectedTeam', 'apiKey']);

  if (!selectedTeam) {
    console.log('No team selected');
    return;
  }

  try {
    // Get current season
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    // NBA season spans two years (e.g., 2025-2026 season is labeled as 2025)
    const season = currentMonth >= 9 ? currentYear : currentYear - 1;

    // Fetch last game for the team
    const headers = {};
    if (apiKey) {
      headers['Authorization'] = apiKey;
    }

    const response = await fetch(
      `${API_BASE}/games?team_ids[]=${selectedTeam.id}&seasons[]=${season}&per_page=100`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      console.log('No games found for this season');
      await chrome.storage.local.set({
        lastGameResult: 'unknown',
        lastGameDate: null,
        lastGameScore: null,
        lastChecked: new Date().toISOString()
      });
      return;
    }

    // Find the most recent completed game
    const now = new Date();
    const completedGames = data.data
      .filter(game => {
        const gameDate = new Date(game.date);
        return game.status === 'Final' || gameDate < now;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (completedGames.length === 0) {
      console.log('No completed games found');
      await chrome.storage.local.set({
        lastGameResult: 'unknown',
        lastGameDate: null,
        lastGameScore: null,
        lastChecked: new Date().toISOString()
      });
      return;
    }

    const lastGame = completedGames[0];
    const isHomeTeam = lastGame.home_team.id === selectedTeam.id;
    const teamScore = isHomeTeam ? lastGame.home_team_score : lastGame.visitor_team_score;
    const opponentScore = isHomeTeam ? lastGame.visitor_team_score : lastGame.home_team_score;
    const opponent = isHomeTeam ? lastGame.visitor_team : lastGame.home_team;

    const result = teamScore > opponentScore ? 'win' : 'loss';
    const scoreString = `${selectedTeam.abbreviation} ${teamScore} - ${opponentScore} ${opponent.abbreviation}`;

    await chrome.storage.local.set({
      lastGameResult: result,
      lastGameDate: lastGame.date,
      lastGameScore: scoreString,
      lastChecked: new Date().toISOString()
    });

    console.log(`Last game result: ${result} (${scoreString})`);

    // Notify content scripts to update
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'updateHideState' }).catch(() => {});
    }

  } catch (error) {
    console.error('Error fetching game data:', error);
    throw error;
  }
}

// Check on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Loyal Sports Fan extension installed');
  checkLastGame().catch(console.error);
});

// Check on browser startup
chrome.runtime.onStartup.addListener(() => {
  checkLastGame().catch(console.error);
});
