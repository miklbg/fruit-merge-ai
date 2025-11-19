# Setup Instructions

## Quick Start

**No build or installation required!** Just open the game and play.

### Option 1: Open Directly
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

For the best experience and to avoid browser file:// protocol restrictions:

```bash
cd game
python3 -m http.server 8080
# Then visit: http://localhost:8080
```

Alternative servers:
```bash
# Using Node.js
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

## First Launch

1. Open `game/index.html` using one of the methods above
2. Click **"Start"** to begin playing
3. Background music will play (browser may require user interaction first)
4. Your game progress and high scores are automatically saved to localStorage

## What's Included

All dependencies are included - no installation needed:
- **Tailwind CSS** - Pre-built and included locally
- **Matter.js** - Physics engine (loaded via CDN)
- **Background Music** - Audio file in `game/assets/`
- **Fruit Images** - Custom illustrations in `game/assets/`

## Development Setup (Optional)

Only needed if you want to modify Tailwind styles:

```bash
# Install dependencies
npm install

# Rebuild Tailwind CSS after making changes
npm run build:css

# Watch for changes and rebuild automatically
npm run watch:css
```

## Browser Compatibility

Works on modern browsers with HTML5 Canvas and Audio support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Support

Fully responsive with touch controls for mobile devices.

## Troubleshooting

**Music doesn't play:**
- Click anywhere on the page to trigger audio (browser autoplay policy)
- Ensure `game/assets/children-music-loop-creative-fun-262427.mp3` exists
- Check browser's autoplay settings

**Game doesn't load:**
- Ensure internet connection (for CDN resources)
- Try using a local server instead of file:// protocol
- Clear browser cache and reload

