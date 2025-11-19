# Testing Guide

## Overview

This guide explains how to test the Fruit Merge Game. The game is a self-contained HTML/CSS/JavaScript application with no automated test framework.

## Quick Test

**Fastest way to verify the game works:**
```bash
# Open the game directly
open game/index.html  # macOS
start game/index.html  # Windows
xdg-open game/index.html  # Linux
```

**Or use a local server (recommended):**
```bash
cd game
python3 -m http.server 8080
# Visit: http://localhost:8080
```

## Manual Test Checklist

### Core Functionality
- [ ] Game loads without console errors
- [ ] Click "Start" button to begin
- [ ] Preview fruit appears and can be positioned with mouse/touch
- [ ] Fruits drop when clicked/tapped
- [ ] Two identical fruits merge into the next level
- [ ] Score increases on merge
- [ ] High score persists across sessions
- [ ] Game over triggers when fruits stack above red line
- [ ] Restart button resets the game

### Audio
- [ ] Drop sound plays when releasing fruit
- [ ] Merge sound plays when fruits combine
- [ ] Game over sound plays at game end
- [ ] Background music plays and loops (if audio file present)
- [ ] Music pauses when switching tabs/apps
- [ ] Music resumes when returning to game

### Persistence
- [ ] High score saves to localStorage
- [ ] Game state can be resumed after page refresh
- [ ] "New Game" button clears saved state

### Responsive Design
- [ ] Works on desktop browsers
- [ ] Touch controls work on mobile devices
- [ ] Game scales properly on different screen sizes
- [ ] No unwanted scrolling or zooming on mobile

### Browser Compatibility
Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, including iOS Safari)

## Console Checks

Watch for these messages during testing:

**Expected (OK):**
- "Layout ready. Wrapper: [width]x[height]..."
- "Loading from saved state..." or "Starting new game..."

**Warnings (Non-Critical):**
- "Autoplay was prevented. User interaction required."
- "Background music could not be loaded..." (if file missing)

**Errors (Should Investigate):**
- Any JavaScript errors
- Network errors (except when intentionally offline)
- Canvas rendering errors

## Performance

The game should maintain smooth 60 FPS gameplay with multiple fruits on screen. Check browser dev tools Performance tab if issues occur.

## Troubleshooting

**Music doesn't play:**
- Click anywhere on page to trigger audio (browser autoplay policy)
- Check that `game/assets/children-music-loop-creative-fun-262427.mp3` exists
- Check browser's autoplay settings

**Game doesn't load:**
- Ensure internet connection (for CDN resources like Matter.js)
- Try using a local server instead of file:// protocol
- Clear browser cache and reload

