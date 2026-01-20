# Loyal Sports Fan - Session Plan

## Project Overview
Chrome extension that hides YouTube videos about the user's NBA team after a loss.

## Current Status
Core functionality is implemented:
- Popup UI with team selection and hide duration
- Background service worker fetching game results from balldontlie.io
- Content script hiding matching YouTube videos

## Tasks

### Documentation
- [x] Add CLAUDE.md - Development guidelines for AI assistants
- [x] Add README.md - Project documentation and setup instructions

### Repository Setup
- [x] Initialize git repository
- [x] Create initial commit
- [ ] Push to GitHub

### Missing Features (Future)
- [x] Add extension icons (assets/icons/)
- [x] Add API key input field in popup UI
- [x] Add API key validation with test API call
- [x] Add rate limit error handling for balldontlie.io API

## Technical Notes
- Uses Chrome Manifest V3
- API: https://api.balldontlie.io/v1
- All 30 NBA teams supported with keyword matching
- Hide duration configurable from 1-168 hours
