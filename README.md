<div align="center">

# 🍓 Fruit Merge Game 🍉

### A delightful physics-based puzzle game where you drop and merge fruits to score points!

[![Play Now](https://img.shields.io/badge/🎮_Play-Now-success?style=for-the-badge)](https://miklbg.github.io/merge_game/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/miklbg/merge_game/pulls)

<img src="screenshot.jpg" alt="Fruit Merge Game Screenshot" width="600">

**[🎯 Play the Game](https://miklbg.github.io/merge_game/)** | **[📖 How to Play](#how-to-play)** | **[⚙️ Development](#development)**

</div>

---

## 🎮 About

**Fruit Merge** is an addictive puzzle game that combines physics simulation with strategic gameplay. Drop fruits into the container, match identical ones to merge them into bigger fruits, and chase the ultimate goal: creating a watermelon! 🍉

Perfect for quick gaming sessions or extended play, this game features smooth physics, delightful sound effects, and a progression system that keeps you coming back for more.

## ✨ Features

### 🍎 Core Gameplay
- **10 Unique Fruit Levels** - Progress from tiny blueberries to massive watermelons
- **Realistic Physics** - Powered by Matter.js for authentic fruit movement and collisions
- **Strategic Merging** - Plan your drops carefully to maximize combos and scores
- **Speed Booster** - Unlock special ability at Level 5 for faster drops (3x speed!)

### 🎯 Game Mechanics
- **Drop Cooldown System** - 400ms between drops prevents spam and adds strategy
- **Warning System** - Visual and audio alerts when fruits stack dangerously high
- **Evolution Tracker** - See which fruits you've unlocked in your current game and all-time
- **Game Over Line** - Keep fruits below the red line or face defeat!

### 🎨 Visual & Audio
- **Confetti Celebrations** - Colorful explosions with every merge
- **Dynamic Animations** - Smooth transitions and particle effects
- **Sound Effects** - Satisfying audio feedback for drops, merges, and warnings
- **Background Music** - Optional looping soundtrack to enhance gameplay
- **Warning Alerts** - Pulsing red line and sound when container fills up

### 💾 Persistence & Quality of Life
- **Auto-Save** - Your progress is saved automatically every 2 seconds
- **High Score Tracking** - Personal best stored locally
- **Auto-Resume** - Continue where you left off (if within 20 seconds)
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **PWA Support** - Install as an app for offline play
- **Pause/Resume** - Burger menu to pause and adjust settings anytime

### 🔧 Customization
- **Music Toggle** - Turn background music on/off
- **Sound Toggle** - Control sound effects independently
- **Preferences Saved** - Your audio settings persist across sessions

## 📖 How to Play

1. **Start the Game** - Click the **Start** button to begin
2. **Position Your Fruit** - Move your mouse/finger left and right to aim
3. **Drop the Fruit** - Click or tap to drop the fruit into the container
4. **Merge Fruits** - When two identical fruits touch, they merge into the next level
5. **Score Points** - Each merge awards points based on the fruit level
6. **Speed Boost** - After unlocking at Level 5 (Lemon), tap twice quickly for a speed boost
7. **Avoid Game Over** - Keep fruit centers below the red line!

### 🎯 Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Position Fruit | Move mouse | Drag finger |
| Drop Fruit | Click | Tap |
| Speed Boost | Double-click quickly | Double-tap quickly |
| Pause/Menu | Click burger icon | Tap burger icon |
| Share Score | N/A | Native share dialog |

### 🍇 Fruit Evolution Chain

```
🫐 Blueberry → 🍓 Strawberry → 🍇 Grapes → 🍊 Orange → 🍎 Apple
           → 🍋 Lemon → 🍈 Cantaloupe → 🍍 Pineapple → 🥥 Coconut → 🍉 Watermelon
```

## 🛠️ Technology Stack

- **Physics Engine**: [Matter.js](https://brm.io/matter-js/) - 2D rigid body physics
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Audio**: Web Audio API - Procedural sound generation + background music
- **Storage**: LocalStorage API - Save game state and preferences
- **PWA**: Service Worker - Offline support and app installation
- **Font**: [Chewy](https://fonts.google.com/specimen/Chewy) from Google Fonts

## 💻 Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/miklbg/merge_game.git
cd merge_game

# Install dependencies
npm install
```

### Build & Run

```bash
# Build Tailwind CSS (one-time)
npm run build:css

# Watch for CSS changes during development
npm run watch:css

# Serve the game locally
# Open game/index.html in your browser
# Or use a local server like:
npx http-server game -p 8080
```

### Project Structure

```
merge_game/
├── game/
│   ├── index.html          # Main game file
│   ├── assets/             # Images and audio
│   ├── audio/              # Audio controller modules
│   ├── css/                # Compiled CSS
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── tailwind.css            # Tailwind source
├── tailwind.config.js      # Tailwind configuration
├── package.json            # Dependencies
└── README.md               # You are here!
```

## 🎯 Game Settings

The game includes several configuration constants that can be adjusted in `game/index.html`:

- **STARTING_FRUIT_LEVELS**: Number of fruit types available at start (default: 4)
- **GAME_OVER_LINE_Y_PERCENT**: Position of the danger line (default: 0.18)
- **DROP_COOLDOWN_MS**: Minimum time between drops (default: 400ms)
- **SPEED_BOOST_WINDOW**: Time window for speed boost (default: 200ms)
- **BOOSTER_UNLOCK_LEVEL**: Fruit level to unlock speed boost (default: 5 - Lemon)

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit Your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Ideas for Contributions

- 🎨 New fruit designs or themes
- 🎵 Additional background music tracks
- 🌐 Translations/internationalization
- 🎮 New game modes or power-ups
- 📱 Mobile optimization improvements
- ♿ Accessibility enhancements

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Physics simulation powered by [Matter.js](https://brm.io/matter-js/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Font by [Google Fonts](https://fonts.google.com/)
- Inspired by classic merge-style puzzle games

---

<div align="center">

**Made with ❤️ by [Mikkel](https://github.com/miklbg)**

⭐ **Star this repo if you enjoyed the game!** ⭐

[Report Bug](https://github.com/miklbg/merge_game/issues) · [Request Feature](https://github.com/miklbg/merge_game/issues)

</div>
