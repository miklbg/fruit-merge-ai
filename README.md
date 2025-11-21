# Fruit Merge Game

A physics-based puzzle game where you drop and merge fruits to create larger fruits and score points!

## 🎮 [PLAY NOW](https://miklbg.github.io/merge_game/) 🎮

Click the button above to start playing instantly in your browser!

## 🎮 How to Play

1. **Click** "Start" to begin playing
2. **Drag** your mouse or finger to position the fruit
3. **Click/Tap** to drop the fruit into the container
4. **Merge** two identical fruits to create the next level fruit
5. **Score** points with each merge - larger fruits give more points!
6. **Game Over** when fruits stack above the red line

## 🍓 Fruit Levels

The game features 10 fruit levels that merge progressively, now with beautiful custom illustrations:
- Blueberry (Level 0) → Strawberry (Level 1) → Grapes (Level 2)
- Orange (Level 3) → Apple (Level 4) → Lemon (Level 5)
- Cantaloupe (Level 6) → Pineapple (Level 7) → Coconut (Level 8)
- Watermelon (Level 9) - Maximum size!

## ✨ Features

- **High-Quality Graphics**: 3x native resolution (1200×1800px) for crisp, sharp rendering on all displays
- **Physics Engine**: Realistic fruit physics powered by Matter.js
- **Responsive Design**: Works on desktop and mobile devices
- **Score Tracking**: Keep track of your high score with localStorage
- **Game State Persistence**: Resume your game where you left off
- **Visual Effects**: Confetti animations when fruits merge, dramatic falling animation on game over
- **Audio Feedback**: Sound effects and background music
- **Smart Controls**: Touch and mouse support with preview positioning
- **Fruit Evolution Display**: Visual progress bar showing all fruit types at the bottom of the game, with unachieved fruits shown blurred
- **Red Line Warning System**: Visual and audio alerts when the container is nearly full
  - **Pulsing Red Line**: The game over line pulses in thickness and glows when fruits approach capacity
  - **Warning Sound**: Subtle audio beep alerts you when fruits enter the danger zone
  - **Smart Detection**: Triggers when stationary fruits reach 90% of the available play area height

## 🔊 Audio Attribution

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
- **Warning Sound**: Two quick beeps (A4 at 440Hz) when fruits enter the danger zone near the red line, with 2-second cooldown
- **Game Over Sound**: A multi-note descending melody (E4→C4→A3→F3) that plays when the game ends
- **Background Music**: A continuous looping melody during gameplay that fades out when the game is paused or ended
  - **Volume Control**: Uses Web Audio API GainNode for reliable, cross-browser volume control (default ~0.25 linear, approximately -12dB)
  - **iOS Safari Support**: Automatically unlocks AudioContext on first user gesture to satisfy iOS Safari autoplay restrictions
  - **Fallback**: Gracefully falls back to HTMLAudioElement.volume when Web Audio API is not available
- **Focus Handling**: Music automatically pauses when you switch tabs or apps, and resumes when you return to the game

## 🛠️ Technical Details

- **No Build Required**: Pure HTML/CSS/JavaScript - just open and play!
- **Styling**: Tailwind CSS
- **Physics**: Matter.js
- **Storage**: LocalStorage for game state and high scores
- **Browser Compatibility**: Modern browsers with HTML5 Audio and Canvas support

## 🚀 Running Locally

Simply open `game/index.html` in your web browser - no installation or build process required!

For local development with a server:
```bash
cd game
python3 -m http.server 8080
# Visit http://localhost:8080
```

## 📝 License

This game is AI-generated. See LICENSE file for details.
