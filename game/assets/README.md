# Audio Assets

This directory contains the audio assets for the Fruit Merge Game.

## Background Music

**File:** `children-music-loop-creative-fun-262427.mp3`

**Source:** https://pixabay.com/music/happy-childrens-tunes-children-music-loop-creative-fun-262427/

**License:** Pixabay License - Free for commercial and non-commercial use

**Track:** Children Music Loop Creative Fun

**Usage in Game:**
- Loops continuously during gameplay
- Volume set to 0.05 (low, unobtrusive background level)
- Automatically pauses when player switches tabs or apps
- Automatically resumes when player returns to the game
- Fades out smoothly on game over or restart

## Sound Effects

Sound effects (drop and merge sounds) are **not** stored as files. They are generated programmatically in real-time using the Web Audio API and are considered **public domain** original works.

**Drop Sound:**
- Descending sine wave tone (400Hz → 200Hz)
- Duration: 100ms
- Plays when a fruit is released

**Merge Sound:**
- Ascending chord progression (C5-E5-G5 with octave doubling)
- Duration: 300ms
- Plays when two fruits successfully merge
