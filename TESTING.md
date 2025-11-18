# Testing Guide

## Overview

This guide explains how to test the Fruit Merge Game. The game is a self-contained HTML/CSS/JavaScript application with no build process or external test framework.

## Quick Test

**Fastest way to verify the game works:**
```bash
# Open the game
open game/index.html  # macOS
# or
start game/index.html  # Windows
# or
xdg-open game/index.html  # Linux
```

## Local Server Testing (Recommended)

For the most reliable testing experience:

**Option 1: Python**
```bash
cd game
python3 -m http.server 8080
# Visit: http://localhost:8080
```

**Option 2: Node.js**
```bash
cd game
npx http-server -p 8080
# Visit: http://localhost:8080
```

## 🧪 Manual Test Scenarios

### 1. Basic Gameplay Tests

**Test: Game Loads**
- [ ] Open `game/index.html`
- [ ] Game wrapper appears with bright orange/sky blue theme
- [ ] Start modal displays with "Start" button
- [ ] No console errors appear

**Test: Start Game**
- [ ] Click "Start" button
- [ ] Modal disappears
- [ ] Preview fruit appears at top (with dashed border)
- [ ] Score shows "0"
- [ ] High Score shows saved value or "0"
- [ ] Next fruit emoji appears in header

**Test: Drop Fruits**
- [ ] Move mouse/finger to drag preview fruit horizontally
- [ ] Preview fruit follows pointer within boundaries
- [ ] Click/tap to drop fruit
- [ ] Drop sound effect plays
- [ ] Fruit falls with physics
- [ ] New preview fruit appears after ~300ms
- [ ] Next fruit updates

**Test: Merge Fruits**
- [ ] Drop two identical fruits next to each other
- [ ] They collide and merge into next level fruit
- [ ] Merge sound effect plays (ascending chime)
- [ ] Confetti animation appears at merge point
- [ ] Score increases
- [ ] Device vibrates on mobile (if supported)

**Test: Score System**
- [ ] Score increases when fruits merge
- [ ] Larger merges give more points
- [ ] High score updates when current score exceeds it
- [ ] High score persists in localStorage

**Test: Game Over**
- [ ] Stack fruits above red line
- [ ] Game over triggers when fruit settles above line
- [ ] Game over sound effect plays (descending tone)
- [ ] Bottom wall disappears
- [ ] All fruits fall through the bottom and disappear
- [ ] "Game Over" modal appears after ~2 second delay
- [ ] Modal fades in smoothly (opacity and scale animation)
- [ ] Final score displays correctly
- [ ] "Restart" button appears
- [ ] Music fades out

**Test: Restart**
- [ ] Click "Restart" button from game over modal
- [ ] Game resets completely
- [ ] Score resets to 0
- [ ] High score remains unchanged
- [ ] Music starts playing again
- [ ] Preview fruit reappears
- [ ] Bottom wall is restored

**Test: New Game Button**
- [ ] Click "New Game" button in header during play
- [ ] Game resets immediately
- [ ] Score resets to 0
- [ ] Saved game state is cleared

### 2. Audio Tests

**Test: Sound Effects**
- [ ] Drop sound plays when dropping a fruit (descending tone)
- [ ] Merge sound plays when fruits merge (ascending chime)
- [ ] Game over sound plays when game ends (descending sawtooth tone)
- [ ] Sounds work without background music
- [ ] Sounds are at appropriate volume

**Test: Background Music - With File**
- [ ] Music file exists at `game/assets/children-music-loop-creative-fun-262427.mp3`
- [ ] Music starts when clicking "Start" button
- [ ] Music loops continuously during gameplay
- [ ] Music volume is set to low level (0.05)
- [ ] Music fades out on game over
- [ ] Music restarts on game restart

**Test: Background Music - Without File**
- [ ] Temporarily rename/move music file
- [ ] Open game
- [ ] Check console for warning message
- [ ] Game still loads and works
- [ ] Sound effects still play
- [ ] No errors or crashes
- [ ] Restore music file after test

### 3. Focus Handling Tests

**Test: Tab Switching**
1. Start the game with music playing
2. Switch to another browser tab
3. Verify: Music pauses
4. Switch back to game tab
5. Verify: Music resumes playing
6. Button shows correct state ("Pause" when playing)

**Test: App Switching**
1. Start the game with music playing
2. Switch to another application (Alt+Tab / Cmd+Tab)
3. Verify: Music pauses
4. Return to browser
5. Verify: Music resumes playing

**Test: Window Blur/Focus**
1. Game playing with music
2. Click outside browser window
3. Verify: Music pauses
4. Click back into browser
5. Verify: Music resumes

### 4. Game Over Animation Tests

**Test: Game Over Sound and Animation Sequence**
1. Play the game and stack fruits above the red line
2. Wait for game over to trigger
3. Observe the complete sequence
**Expected Results:**
- [ ] Game over sound effect plays immediately (descending sawtooth tone, ~0.5s)
- [ ] Background music starts fading out
- [ ] Bottom wall disappears
- [ ] All fruits begin falling downward
- [ ] Fruits fall through where the bottom wall was
- [ ] Physics continues for ~2 seconds
- [ ] Game over modal appears after the delay
- [ ] Modal fades in smoothly (opacity 0→1, scale 0.9→1.0, over 0.3s)
- [ ] Final score is displayed correctly in the modal

**Test: Game Over Modal Fade-In**
1. Trigger game over
2. Watch the modal appearance carefully
**Expected Results:**
- [ ] Modal does NOT appear immediately
- [ ] Modal appears approximately 2 seconds after trigger
- [ ] Modal opacity increases smoothly from 0 to 1
- [ ] Modal scales smoothly from 0.9 to 1.0
- [ ] Fade-in animation completes in ~0.3 seconds
- [ ] Modal content (title, score, button) is visible after fade-in

**Test: Fruits Fall Animation**
1. Drop several fruits to create a stack
2. Trigger game over
3. Observe the falling animation
**Expected Results:**
- [ ] All fruits on screen start falling immediately
- [ ] Fruits fall with realistic physics (gravity)
- [ ] Fruits disappear below the visible area
- [ ] No fruits remain on screen after ~2 seconds
- [ ] No errors occur during the falling animation

**Test: Game Over with Few Fruits**
1. Trigger game over with only 1-2 fruits on screen
2. Observe the behavior
**Expected Results:**
- [ ] Sound and animation sequence works correctly
- [ ] Modal appears after delay even with few/no fruits
- [ ] No errors in console

**Test: Game Over Restart**
1. Complete a game over sequence
2. Click "Restart" button
3. Play again and trigger another game over
**Expected Results:**
- [ ] Bottom wall is restored after restart
- [ ] Second game over sequence works identically to first
- [ ] All animations and sounds work on repeated game overs

### 5. Persistence Tests

**Test: Game State Saving**
- [ ] Play for a few moves
- [ ] Refresh the page
- [ ] Click "Resume" (not "Start")
- [ ] Game state restores with all fruits in same positions
- [ ] Score is preserved
- [ ] Next fruit is preserved

**Test: High Score Persistence**
- [ ] Play and achieve a high score
- [ ] Close browser completely
- [ ] Reopen game
- [ ] High score is still displayed

**Test: Clear Saved State**
- [ ] Save a game state
- [ ] Click "New Game" or "Restart"
- [ ] Refresh page
- [ ] Verify: Shows "Start" not "Resume"
- [ ] Verify: Game starts fresh

### 5. Responsive Design Tests

**Test: Desktop**
- [ ] Open on desktop browser
- [ ] Game container maintains 2:3 aspect ratio
- [ ] Fits within viewport
- [ ] Mouse controls work smoothly
- [ ] Graphics scale properly

**Test: Mobile/Tablet**
- [ ] Open on mobile device or use browser dev tools
- [ ] Touch controls work for dragging
- [ ] Tap to drop works
- [ ] Game scales to screen size
- [ ] No unwanted scrolling or zooming

**Test: Window Resize**
- [ ] Start playing with fruits on screen
- [ ] Resize browser window
- [ ] Game state saves before resize
- [ ] Game reinitializes with saved state
- [ ] All fruits restore at correct positions (scaled)
- [ ] Music stops and can be restarted

### 6. Edge Cases & Error Handling

**Test: Rapid Clicking**
- [ ] Try dropping fruits very quickly
- [ ] Verify: Only one fruit drops at a time
- [ ] Verify: No duplicate fruits appear

**Test: Maximum Fruit**
- [ ] Merge up to watermelon (level 9)
- [ ] Try to merge two watermelons
- [ ] Verify: They don't merge (max level reached)
- [ ] Verify: No errors occur

**Test: Browser Autoplay Policy**
- [ ] Open game in browser with strict autoplay policy
- [ ] Verify: Console shows autoplay warning (not error)
- [ ] Click "Start"
- [ ] Verify: Music attempts to play
- [ ] Game works regardless of music state

**Test: Missing Dependencies (CDN)**
- [ ] Disable internet connection
- [ ] Try to load game
- [ ] Verify: Appropriate error handling (may not fully load)
- [ ] Re-enable connection and reload
- [ ] Verify: Game loads properly

**Test: LocalStorage Full/Disabled**
- [ ] Disable localStorage in browser settings
- [ ] Play the game
- [ ] Verify: Game works but doesn't save state
- [ ] Verify: No crashes or errors

## 🔍 Browser Console Checks

During testing, monitor the browser console for:

### Expected Messages (OK)
```
✓ "Layout ready. Wrapper: [width]x[height], Header: [height]"
✓ "Loading from saved state..." (when resuming)
✓ "Starting new game..." (when starting fresh)
```

### Expected Warnings (Non-Critical)
```
⚠ "Autoplay was prevented. User interaction required."
⚠ "Background music could not be loaded..." (only if file missing)
⚠ "Could not resume music: [error]"
```

### Errors (Should Investigate)
```
❌ Any JavaScript errors
❌ Network errors (except if intentionally offline)
❌ Canvas rendering errors
```

## 📊 Performance Checks

**Test: Frame Rate**
- [ ] Open browser dev tools (Performance tab)
- [ ] Play for 30+ seconds with many fruits
- [ ] Check: Maintains ~60 FPS
- [ ] Check: No significant frame drops
- [ ] Check: Physics calculations are smooth

**Test: Memory Usage**
- [ ] Open browser dev tools (Memory tab)
- [ ] Play through multiple game overs
- [ ] Check: No significant memory leaks
- [ ] Check: Memory usage is reasonable

## 🌐 Browser Compatibility Testing

Test on multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

For each browser, verify:
- Game loads correctly
- Physics works smoothly
- Audio plays (or gracefully fails)
- Controls are responsive
- Visual effects render properly

## ✅ Pre-Release Checklist

Before considering the game "ready":
- [ ] All basic gameplay tests pass
- [ ] Audio works correctly (or fails gracefully)
- [ ] Game state persistence works
- [ ] Responsive on desktop and mobile
- [ ] No console errors during normal gameplay
- [ ] High scores save and persist
- [ ] Browser compatibility verified
- [ ] Performance is acceptable

## 🐛 Known Limitations

- No automated test suite (pure HTML/CSS/JS game)
- Browser autoplay policies may prevent music without user interaction
- LocalStorage limits (~5-10MB) could affect saved states with many games
- Physics simulation may vary slightly across different devices/browsers

## 📝 Reporting Issues

When reporting bugs, include:
1. Browser and version
2. Operating system
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Screenshots/video if relevant
