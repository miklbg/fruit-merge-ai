# Fruit Merge Game

A physics-based puzzle game where you drop and merge fruits to create larger fruits and score points!

## 🎮 How to Play

1. **Open** `game/index.html` in your web browser
2. **Click** "Start" to begin playing
3. **Drag** your mouse or finger to position the fruit
4. **Click/Tap** to drop the fruit into the container
5. **Merge** two identical fruits to create the next level fruit
6. **Score** points with each merge - larger fruits give more points!
7. **Game Over** when fruits stack above the red line

## 🍓 Fruit Levels

The game features 10 fruit levels that merge progressively:
- 🍒 Cherry (Level 0) → 🍓 Strawberry (Level 1) → 🍇 Grapes (Level 2)
- 🍊 Orange (Level 3) → 🍎 Apple (Level 4) → 🍐 Pear (Level 5)
- 🍑 Peach (Level 6) → 🍍 Pineapple (Level 7) → 🍈 Melon (Level 8)
- 🍉 Watermelon (Level 9) - Maximum size!

## ✨ Features

- **Physics Engine**: Realistic fruit physics powered by Matter.js
- **Responsive Design**: Works on desktop and mobile devices
- **Score Tracking**: Keep track of your high score with localStorage
- **Game State Persistence**: Resume your game where you left off
- **Visual Effects**: Confetti animations when fruits merge
- **Audio Feedback**: Sound effects and background music
- **Smart Controls**: Touch and mouse support with preview positioning

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
- **Background Music**: A continuous looping melody during gameplay that fades out when the game is paused or ended
- **Focus Handling**: Music automatically pauses when you switch tabs or apps, and resumes when you return to the game

## 🛠️ Technical Details

- **No Build Required**: Pure HTML/CSS/JavaScript - just open and play!
- **Styling**: Tailwind CSS (loaded via CDN)
- **Physics**: Matter.js 0.19.0 (loaded via CDN)
- **Storage**: LocalStorage for game state and high scores
- **Browser Compatibility**: Modern browsers with HTML5 Audio and Canvas support

## 🚀 Quick Start

Simply open `game/index.html` in your web browser - no installation or build process required!

For local server testing:
```bash
cd game
python3 -m http.server 8080
# Visit http://localhost:8080
```

## 📝 License

This game is AI-generated. See LICENSE file for details.
