// Loyal Sports Fan - YouTube Content Script
// Hides videos related to selected NBA team after a loss

let selectedTeam = null;
let hideDurationHours = 24;
let lastGameResult = null;
let lastGameDate = null;
let isHiding = false;

// Video container selectors for different YouTube sections
const VIDEO_SELECTORS = [
  'ytd-rich-item-renderer',       // Home page grid
  'ytd-video-renderer',           // Search results
  'ytd-compact-video-renderer',   // Sidebar recommendations
  'ytd-grid-video-renderer',      // Channel page grid
  'ytd-reel-item-renderer',       // Shorts
  'ytd-playlist-video-renderer'   // Playlist items
];

// Initialize
async function init() {
  await loadSettings();
  setupObserver();
  processExistingVideos();

  // Listen for updates from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateHideState') {
      loadSettings().then(() => {
        processExistingVideos();
      });
    }
  });
}

// Load settings and game state
async function loadSettings() {
  const syncData = await chrome.storage.sync.get(['selectedTeam', 'hideDurationHours']);
  const localData = await chrome.storage.local.get(['lastGameResult', 'lastGameDate']);

  selectedTeam = syncData.selectedTeam || null;
  hideDurationHours = syncData.hideDurationHours || 24;
  lastGameResult = localData.lastGameResult || null;
  lastGameDate = localData.lastGameDate || null;

  // Determine if we should be hiding videos
  isHiding = shouldHideVideos();

  console.log('Loyal Sports Fan:', {
    team: selectedTeam?.name,
    result: lastGameResult,
    isHiding
  });
}

// Check if we should hide videos based on last game result and duration
function shouldHideVideos() {
  if (!selectedTeam || !lastGameResult || lastGameResult !== 'loss') {
    return false;
  }

  if (!lastGameDate) {
    return false;
  }

  const gameTime = new Date(lastGameDate).getTime();
  const now = Date.now();
  const hideDurationMs = hideDurationHours * 60 * 60 * 1000;

  // Check if we're still within the hide duration
  return (now - gameTime) < hideDurationMs;
}

// Check if text contains team keywords
function containsTeamKeywords(text) {
  if (!selectedTeam || !text) return false;

  const lowerText = text.toLowerCase();

  // Check all keywords for the team
  for (const keyword of selectedTeam.keywords) {
    // Use word boundary matching to avoid false positives
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    if (regex.test(lowerText)) {
      return true;
    }
  }

  return false;
}

// Escape special regex characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get video title from a video element
function getVideoTitle(videoElement) {
  // Try different selectors for video titles
  const titleSelectors = [
    '#video-title',
    'a#video-title',
    'span#video-title',
    'yt-formatted-string#video-title',
    '.title',
    '[title]'
  ];

  for (const selector of titleSelectors) {
    const titleEl = videoElement.querySelector(selector);
    if (titleEl) {
      return titleEl.textContent || titleEl.getAttribute('title') || '';
    }
  }

  return '';
}

// Process a single video element
function processVideo(videoElement) {
  if (!isHiding) {
    // Make sure video is visible if we're not hiding
    videoElement.style.display = '';
    videoElement.removeAttribute('data-loyal-hidden');
    return;
  }

  // Skip if already processed
  if (videoElement.hasAttribute('data-loyal-processed')) {
    return;
  }

  const title = getVideoTitle(videoElement);

  if (containsTeamKeywords(title)) {
    videoElement.style.display = 'none';
    videoElement.setAttribute('data-loyal-hidden', 'true');
    console.log('Loyal Sports Fan: Hidden video -', title);
  }

  videoElement.setAttribute('data-loyal-processed', 'true');
}

// Process all existing videos on the page
function processExistingVideos() {
  // Clear previous processing state if settings changed
  document.querySelectorAll('[data-loyal-processed]').forEach(el => {
    el.removeAttribute('data-loyal-processed');
  });

  // Show all previously hidden videos first
  document.querySelectorAll('[data-loyal-hidden]').forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-loyal-hidden');
  });

  // Now process based on current state
  const selector = VIDEO_SELECTORS.join(', ');
  const videos = document.querySelectorAll(selector);

  videos.forEach(video => processVideo(video));
}

// Setup MutationObserver for dynamically loaded content
function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    if (!isHiding) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check if the added node itself is a video container
        for (const selector of VIDEO_SELECTORS) {
          if (node.matches && node.matches(selector)) {
            processVideo(node);
          }
        }

        // Check for video containers within the added node
        if (node.querySelectorAll) {
          const videos = node.querySelectorAll(VIDEO_SELECTORS.join(', '));
          videos.forEach(video => processVideo(video));
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Handle navigation (YouTube is a SPA)
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Re-process videos on navigation
    setTimeout(() => {
      processExistingVideos();
    }, 1000);
  }
});

urlObserver.observe(document.body, { childList: true, subtree: true });

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' || area === 'local') {
    loadSettings().then(() => {
      processExistingVideos();
    });
  }
});

// Start
init();
