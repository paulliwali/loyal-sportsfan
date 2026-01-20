// All 30 NBA teams with their balldontlie.io IDs and keywords
const NBA_TEAMS = [
  { id: 1, name: "Atlanta Hawks", abbreviation: "ATL", keywords: ["hawks", "atlanta", "atl"] },
  { id: 2, name: "Boston Celtics", abbreviation: "BOS", keywords: ["celtics", "boston", "bos"] },
  { id: 3, name: "Brooklyn Nets", abbreviation: "BKN", keywords: ["nets", "brooklyn", "bkn"] },
  { id: 4, name: "Charlotte Hornets", abbreviation: "CHA", keywords: ["hornets", "charlotte", "cha"] },
  { id: 5, name: "Chicago Bulls", abbreviation: "CHI", keywords: ["bulls", "chicago", "chi"] },
  { id: 6, name: "Cleveland Cavaliers", abbreviation: "CLE", keywords: ["cavaliers", "cavs", "cleveland", "cle"] },
  { id: 7, name: "Dallas Mavericks", abbreviation: "DAL", keywords: ["mavericks", "mavs", "dallas", "dal"] },
  { id: 8, name: "Denver Nuggets", abbreviation: "DEN", keywords: ["nuggets", "denver", "den"] },
  { id: 9, name: "Detroit Pistons", abbreviation: "DET", keywords: ["pistons", "detroit", "det"] },
  { id: 10, name: "Golden State Warriors", abbreviation: "GSW", keywords: ["warriors", "golden state", "gsw", "dubs"] },
  { id: 11, name: "Houston Rockets", abbreviation: "HOU", keywords: ["rockets", "houston", "hou"] },
  { id: 12, name: "Indiana Pacers", abbreviation: "IND", keywords: ["pacers", "indiana", "ind"] },
  { id: 13, name: "LA Clippers", abbreviation: "LAC", keywords: ["clippers", "lac"] },
  { id: 14, name: "Los Angeles Lakers", abbreviation: "LAL", keywords: ["lakers", "los angeles lakers", "lal"] },
  { id: 15, name: "Memphis Grizzlies", abbreviation: "MEM", keywords: ["grizzlies", "memphis", "mem", "grizz"] },
  { id: 16, name: "Miami Heat", abbreviation: "MIA", keywords: ["heat", "miami", "mia"] },
  { id: 17, name: "Milwaukee Bucks", abbreviation: "MIL", keywords: ["bucks", "milwaukee", "mil"] },
  { id: 18, name: "Minnesota Timberwolves", abbreviation: "MIN", keywords: ["timberwolves", "wolves", "minnesota", "min"] },
  { id: 19, name: "New Orleans Pelicans", abbreviation: "NOP", keywords: ["pelicans", "new orleans", "nop", "pels"] },
  { id: 20, name: "New York Knicks", abbreviation: "NYK", keywords: ["knicks", "new york knicks", "nyk"] },
  { id: 21, name: "Oklahoma City Thunder", abbreviation: "OKC", keywords: ["thunder", "oklahoma city", "okc"] },
  { id: 22, name: "Orlando Magic", abbreviation: "ORL", keywords: ["magic", "orlando", "orl"] },
  { id: 23, name: "Philadelphia 76ers", abbreviation: "PHI", keywords: ["76ers", "sixers", "philadelphia", "phi", "philly"] },
  { id: 24, name: "Phoenix Suns", abbreviation: "PHX", keywords: ["suns", "phoenix", "phx"] },
  { id: 25, name: "Portland Trail Blazers", abbreviation: "POR", keywords: ["blazers", "trail blazers", "portland", "por"] },
  { id: 26, name: "Sacramento Kings", abbreviation: "SAC", keywords: ["kings", "sacramento", "sac"] },
  { id: 27, name: "San Antonio Spurs", abbreviation: "SAS", keywords: ["spurs", "san antonio", "sas"] },
  { id: 28, name: "Toronto Raptors", abbreviation: "TOR", keywords: ["raptors", "toronto", "tor"] },
  { id: 29, name: "Utah Jazz", abbreviation: "UTA", keywords: ["jazz", "utah", "uta"] },
  { id: 30, name: "Washington Wizards", abbreviation: "WAS", keywords: ["wizards", "washington", "was"] }
];

// DOM elements
const teamSelect = document.getElementById('team-select');
const hideDuration = document.getElementById('hide-duration');
const apiKeyInput = document.getElementById('api-key');
const validateBtn = document.getElementById('validate-btn');
const apiKeyStatus = document.getElementById('api-key-status');
const statusBox = document.getElementById('status-box');
const statusText = document.getElementById('status-text');
const lastGame = document.getElementById('last-game');
const saveBtn = document.getElementById('save-btn');
const checkBtn = document.getElementById('check-btn');
const message = document.getElementById('message');

// API validation state
let apiKeyValidated = false;

// Populate team dropdown
function populateTeams() {
  NBA_TEAMS.forEach(team => {
    const option = document.createElement('option');
    option.value = team.id;
    option.textContent = team.name;
    teamSelect.appendChild(option);
  });
}

// Load saved settings
async function loadSettings() {
  const result = await chrome.storage.sync.get(['selectedTeam', 'hideDurationHours', 'apiKey']);

  if (result.selectedTeam) {
    teamSelect.value = result.selectedTeam.id;
  }

  if (result.hideDurationHours) {
    hideDuration.value = result.hideDurationHours;
  }

  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }

  // Load game state
  const state = await chrome.storage.local.get(['lastGameResult', 'lastGameDate', 'lastGameScore']);
  updateStatusDisplay(state, result.selectedTeam);
}

// Update status display
function updateStatusDisplay(state, team) {
  if (!team || !state.lastGameResult) {
    statusBox.classList.add('hidden');
    return;
  }

  statusBox.classList.remove('hidden');

  if (state.lastGameResult === 'win') {
    statusText.textContent = 'Last Game: WIN';
    statusText.className = 'status-text win';
  } else if (state.lastGameResult === 'loss') {
    statusText.textContent = 'Last Game: LOSS';
    statusText.className = 'status-text loss';
  } else {
    statusText.textContent = 'Unknown';
    statusText.className = 'status-text unknown';
  }

  if (state.lastGameDate) {
    const date = new Date(state.lastGameDate);
    lastGame.textContent = `${date.toLocaleDateString()} - ${state.lastGameScore || ''}`;
  }
}

// Save settings
async function saveSettings() {
  const teamId = parseInt(teamSelect.value);
  const duration = parseInt(hideDuration.value);
  const apiKey = apiKeyInput.value.trim();

  if (!teamId) {
    showMessage('Please select a team', 'error');
    return;
  }

  if (duration < 1 || duration > 168) {
    showMessage('Duration must be between 1 and 168 hours', 'error');
    return;
  }

  // Warn if API key entered but not validated
  if (apiKey && !apiKeyValidated) {
    showApiKeyStatus('⚠ API key not validated - click Validate to verify', 'invalid');
  }

  const team = NBA_TEAMS.find(t => t.id === teamId);

  await chrome.storage.sync.set({
    selectedTeam: team,
    hideDurationHours: duration,
    apiKey: apiKey
  });

  showMessage('Settings saved!', 'success');

  // Trigger a game check
  chrome.runtime.sendMessage({ action: 'checkGame' });
}

// Check game now
async function checkGameNow() {
  checkBtn.textContent = 'Checking...';
  checkBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkGame' });

    if (response && response.success) {
      // Reload state to show updated status
      const result = await chrome.storage.sync.get(['selectedTeam']);
      const state = await chrome.storage.local.get(['lastGameResult', 'lastGameDate', 'lastGameScore']);
      updateStatusDisplay(state, result.selectedTeam);
      showMessage('Game status updated!', 'success');
    } else {
      showMessage(response?.error || 'Failed to check game', 'error');
    }
  } catch (error) {
    showMessage('Error checking game status', 'error');
  }

  checkBtn.textContent = 'Check Now';
  checkBtn.disabled = false;
}

// Show message
function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;

  setTimeout(() => {
    message.classList.add('hidden');
  }, 3000);
}

// Show API key status
function showApiKeyStatus(text, type) {
  apiKeyStatus.textContent = text;
  apiKeyStatus.className = `api-key-status ${type}`;
}

// Validate API key
async function validateApiKey() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showApiKeyStatus('No API key entered', 'invalid');
    apiKeyValidated = false;
    return false;
  }

  validateBtn.textContent = 'Validating...';
  validateBtn.disabled = true;
  showApiKeyStatus('Validating API key...', 'validating');

  try {
    const response = await fetch('https://api.balldontlie.io/v1/teams', {
      headers: { 'Authorization': apiKey }
    });

    if (response.ok) {
      showApiKeyStatus('✓ API key is valid', 'valid');
      apiKeyValidated = true;
      validateBtn.textContent = 'Validate';
      validateBtn.disabled = false;
      return true;
    } else if (response.status === 401) {
      showApiKeyStatus('✗ Invalid API key', 'invalid');
      apiKeyValidated = false;
    } else if (response.status === 429) {
      showApiKeyStatus('✗ Rate limited - try again later', 'invalid');
      apiKeyValidated = false;
    } else {
      showApiKeyStatus(`✗ Error: ${response.status}`, 'invalid');
      apiKeyValidated = false;
    }
  } catch (error) {
    showApiKeyStatus('✗ Network error - check connection', 'invalid');
    apiKeyValidated = false;
  }

  validateBtn.textContent = 'Validate';
  validateBtn.disabled = false;
  return false;
}

// Clear validation status when key changes
apiKeyInput.addEventListener('input', () => {
  apiKeyValidated = false;
  apiKeyStatus.classList.add('hidden');
});

// Event listeners
saveBtn.addEventListener('click', saveSettings);
checkBtn.addEventListener('click', checkGameNow);
validateBtn.addEventListener('click', validateApiKey);

// Initialize
populateTeams();
loadSettings();
