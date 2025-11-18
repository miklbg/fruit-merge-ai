# Setup Instructions

## Quick Start

**No build or installation required!** Just open the game and play.

### Option 1: Open Directly (Simplest)
```bash
# Navigate to the game directory
cd game

# Open in your browser (choose your preferred method):
open index.html           # macOS
start index.html          # Windows
xdg-open index.html       # Linux
```

Or simply double-click `game/index.html` in your file explorer.

### Option 2: Local Web Server (Recommended)

For the best experience and to avoid any potential browser file:// protocol restrictions:

```bash
# Navigate to the game directory
cd game

# Start a simple HTTP server
python3 -m http.server 8080
# or
python -m http.server 8080

# Then open in your browser:
# http://localhost:8080
```

Alternative servers:
```bash
# Using Node.js
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

## 🎮 First Launch

1. Open `game/index.html` using one of the methods above
2. Click the **"Start"** button to begin playing
3. The game will load with background music (browser may require interaction first)
4. Your game progress and high scores are automatically saved to localStorage

## 📦 What's Included

All dependencies are loaded via CDN - no installation needed:
- **Tailwind CSS** - For styling
- **Matter.js** - For physics simulation
- **Background Music** - Pre-loaded audio file in `assets/`

## 🔊 Audio Setup

### Background Music
The background music file is already included in the repository:
- **Path:** `game/assets/children-music-loop-creative-fun-262427.mp3`
- **Source:** https://pixabay.com/music/happy-childrens-tunes-children-music-loop-creative-fun-262427/
- **License:** Pixabay License - Free for commercial and non-commercial use

### Audio Features
- **Sound Effects**: Generated programmatically using Web Audio API
- **Background Music**: Loops continuously during gameplay
- **Auto-pause**: Music pauses when you switch tabs or apps
- **Auto-resume**: Music resumes when you return to the game
- **Fade effects**: Smooth volume transitions when starting/stopping

### Verify Audio Works
1. Start the game
2. Listen for background music (may need to click "Start" first due to browser autoplay policies)
3. Switch to another tab - music should pause
4. Return to the game tab - music should resume
5. Drop a fruit - hear the drop sound effect
6. Merge fruits - hear the merge sound effect

## 🌐 Browser Compatibility

The game works best on modern browsers that support:
- HTML5 Canvas
- HTML5 Audio API
- Web Audio API
- Page Visibility API
- LocalStorage

Recommended browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 Mobile Support

The game is fully responsive and works on mobile devices:
- Touch controls for dragging and dropping fruits
- Responsive layout that adapts to screen size
- Touch-optimized physics and controls

## 🐛 Troubleshooting

**Music doesn't play:**
- Check browser console for errors
- Ensure the music file exists at `game/assets/children-music-loop-creative-fun-262427.mp3`
- Click anywhere on the page to trigger audio (browser autoplay policy)
- Check browser's autoplay settings

**Game doesn't load:**
- Ensure you have an internet connection (for CDN resources)
- Check browser console for errors
- Try using a local server instead of file:// protocol
- Clear browser cache and reload

**Graphics look wrong:**
- Ensure JavaScript is enabled
- Try a different browser
- Check browser console for errors
