# merge_game
An AI generated game

## Sound Effects and Music Attribution

### Sound Effects
Sound effects (drop and merge sounds) are generated programmatically using the Web Audio API. These are original works created specifically for this game and are in the **public domain**.

### Background Music
Background music is sourced from Pixabay:
- **Track:** Children Music Loop Creative Fun
- **Source:** https://pixabay.com/music/happy-childrens-tunes-children-music-loop-creative-fun-262427/
- **License:** Pixabay License - Free for commercial and non-commercial use
- **File:** `game/assets/children-music-loop-creative-fun-262427.mp3`

### Audio Features
- **Drop Sound**: A descending tone played when fruits are released
- **Merge Sound**: A cheerful ascending chime played when fruits merge
- **Background Music**: A continuous looping melody during gameplay that fades out when the game is paused or ended
  - **Volume Control**: Uses Web Audio API GainNode for reliable, cross-browser volume control (default ~0.25 linear, approximately -12dB)
  - **iOS Safari Support**: Automatically unlocks AudioContext on first user gesture to satisfy iOS Safari autoplay restrictions
  - **Fallback**: Gracefully falls back to HTMLAudioElement.volume when Web Audio API is not available
- **Focus Handling**: Music automatically pauses when you switch tabs or apps, and resumes when you return to the game

### Adjusting Background Music Volume

The background music volume can be adjusted by modifying the `defaultGain` parameter in `game/index.html`:

```javascript
bgmController = createBgmController({
    audioElOrSrc: 'assets/children-music-loop-creative-fun-262427.mp3',
    defaultGain: 0.25,  // Linear gain (0.0 to 1.0)
    loop: true
});
```

You can also use decibel values using the helper functions:
```javascript
// Set volume to -6dB (approximately 0.5 linear)
bgmController.setGainDb(-6);

// Or use linear values directly
bgmController.setGainLinear(0.5);
```

**Common Volume Levels:**
- `-12dB` ≈ `0.25` linear (default, pleasant background level)
- `-6dB` ≈ `0.5` linear (medium)
- `0dB` = `1.0` linear (full volume)
- `-20dB` ≈ `0.1` linear (very quiet)
