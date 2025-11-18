# Web Audio BGM Integration Guide

This guide shows how to integrate the Web Audio API background music wrapper into your game or application.

## Quick Start

### 1. Import the Module

```javascript
import { createBgmController } from './audio/web-audio-bgm.js';
```

### 2. Create a BGM Controller

```javascript
let bgmController = null;

function initBackgroundMusic() {
    if (!bgmController) {
        bgmController = createBgmController({
            audioElOrSrc: 'assets/your-music-file.mp3',
            defaultGain: 0.25,  // Linear gain (0.25 ≈ -12dB)
            loop: true
        });
        
        // Setup iOS Safari unlock
        bgmController.unlockOnUserGesture();
    }
}
```

### 3. Start Music on User Gesture

**Critical for iOS Safari**: Audio must be triggered by a user gesture.

```javascript
// On button click, touch, or any user interaction
startButton.addEventListener('click', async () => {
    initBackgroundMusic();
    await bgmController.play();
});
```

### 4. Control Playback

```javascript
// Pause music
bgmController.pause();

// Resume music
await bgmController.play();

// Check if playing
if (bgmController.isPlaying()) {
    console.log('Music is playing');
}
```

### 5. Adjust Volume

```javascript
// Set volume using linear gain (0.0 to 1.0)
bgmController.setGainLinear(0.5);  // 50% volume

// Set volume using decibels
bgmController.setGainDb(-6);  // -6dB (approximately 50%)

// Get current gain
const currentGain = bgmController.getGainLinear();
console.log(`Current gain: ${currentGain}`);
```

## Complete Integration Example

```javascript
import { createBgmController } from './audio/web-audio-bgm.js';

let bgmController = null;
let isMusicPaused = false;

// Initialize on first user interaction
function setupBackgroundMusic() {
    if (!bgmController) {
        try {
            bgmController = createBgmController({
                audioElOrSrc: 'assets/background-music.mp3',
                defaultGain: 0.25,  // -12dB
                loop: true
            });
            
            // Install unlock listeners for iOS Safari
            bgmController.unlockOnUserGesture();
            
            console.log('BGM controller initialized');
        } catch (error) {
            console.warn('Failed to initialize background music:', error);
        }
    }
}

// Start music (call on user gesture like button click)
async function startMusic() {
    setupBackgroundMusic();
    if (bgmController && !isMusicPaused) {
        try {
            await bgmController.play();
            console.log('Music started');
        } catch (error) {
            console.warn('Failed to start music:', error);
        }
    }
}

// Stop with fade out
function stopMusic() {
    if (bgmController && bgmController.isPlaying()) {
        isMusicPaused = true;
        
        // Fade out over 1 second
        const fadeOutInterval = setInterval(() => {
            const currentGain = bgmController.getGainLinear();
            if (currentGain > 0.01) {
                bgmController.setGainLinear(currentGain - 0.01);
            } else {
                bgmController.pause();
                bgmController.setGainLinear(0.25); // Reset for next play
                clearInterval(fadeOutInterval);
            }
        }, 50);
    }
}

// Resume music
async function resumeMusic() {
    if (bgmController && isMusicPaused) {
        isMusicPaused = false;
        bgmController.setGainLinear(0.25);
        try {
            await bgmController.play();
            console.log('Music resumed');
        } catch (error) {
            console.warn('Failed to resume music:', error);
        }
    }
}

// Handle page visibility changes (tab switching)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (bgmController && bgmController.isPlaying()) {
            bgmController.pause();
            isMusicPaused = true;
        }
    } else {
        resumeMusic();
    }
});

// Wire up to your game's start button
const startButton = document.getElementById('start-button');
startButton.addEventListener('click', async () => {
    await startMusic();
    // Start your game...
});
```

## Volume Conversion Reference

### Common Volume Levels

| Description | Decibels | Linear |
|-------------|----------|--------|
| Very quiet | -20dB | 0.10 |
| Default (recommended) | -12dB | 0.25 |
| Medium | -6dB | 0.50 |
| Loud | -3dB | 0.71 |
| Full | 0dB | 1.00 |

### Helper Functions

The module exports helper functions for conversion:

```javascript
import { dbToLinear, linearToDb } from './audio/web-audio-bgm.js';

// Convert -12dB to linear
const linear = dbToLinear(-12);  // ≈ 0.251

// Convert 0.5 linear to dB
const db = linearToDb(0.5);  // ≈ -6.02

// Use in controller
bgmController.setGainDb(-12);  // Same as setGainLinear(0.251)
```

## iOS Safari Best Practices

1. **Always unlock on user gesture**: Call `unlockOnUserGesture()` or manually unlock:
   ```javascript
   bgmController.unlockOnUserGesture();
   ```

2. **Start playback from user event**: The first `play()` must be triggered by user interaction:
   ```javascript
   button.addEventListener('click', async () => {
       await bgmController.play();
   });
   ```

3. **Handle autoplay errors gracefully**:
   ```javascript
   try {
       await bgmController.play();
   } catch (error) {
       console.log('Autoplay prevented, will retry on next user gesture');
   }
   ```

## Fallback Behavior

If Web Audio API is unavailable (very old browsers), the controller automatically falls back to `HTMLAudioElement.volume`. The API remains the same, so your code doesn't need to change.

```javascript
// Works on all browsers - Web Audio or fallback
bgmController.setGainLinear(0.5);
```

## API Reference

### `createBgmController(options)`

Creates and returns a background music controller.

**Parameters:**
- `options.audioElOrSrc` (string|HTMLAudioElement) - Audio source URL or element
- `options.defaultGain` (number, optional) - Default gain (0-1), default: 0.25
- `options.loop` (boolean, optional) - Whether to loop, default: true

**Returns:** Object with methods:
- `play()` - Start/resume playback (returns Promise)
- `pause()` - Pause playback
- `setGainLinear(value)` - Set gain using linear value (0-1)
- `setGainDb(db)` - Set gain using decibels
- `getGainLinear()` - Get current linear gain
- `isPlaying()` - Check if currently playing
- `unlockOnUserGesture()` - Install iOS Safari unlock listeners
- `dbToLinear(db)` - Convert dB to linear
- `linearToDb(linear)` - Convert linear to dB

## Troubleshooting

### Music doesn't play on iOS Safari
- Ensure `unlockOnUserGesture()` is called
- Ensure first `play()` is triggered by user interaction (click, touch)
- Check browser console for autoplay policy errors

### Volume too quiet/loud
- Adjust `defaultGain` parameter (try 0.1 to 0.5)
- Use `setGainDb()` for precise control
- Reference the volume conversion table above

### Music doesn't loop
- Ensure `loop: true` in options
- Check if audio file loaded successfully

### Multiple MediaElementSource error
- Don't call `createBgmController()` multiple times on same audio element
- The wrapper prevents this internally, but reuse the same controller

## Example Projects

See the main game implementation in `game/index.html` for a complete, production-ready example.
