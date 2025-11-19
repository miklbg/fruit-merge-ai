# Game Assets

This directory contains the graphic and audio assets for the Fruit Merge Game.

## Background Music

**File:** `children-music-loop-creative-fun-262427.mp3`

**Source:** https://pixabay.com/music/happy-childrens-tunes-children-music-loop-creative-fun-262427/

**License:** Pixabay License - Free for commercial and non-commercial use

**Track:** Children Music Loop Creative Fun

**Usage in Game:**
- Loops continuously during gameplay
- Volume controlled via Web Audio API (default ~0.25 linear gain)
- Automatically pauses when player switches tabs or apps
- Automatically resumes when player returns to the game
- Fades out smoothly on game over

## Sound Effects

Sound effects (drop, merge, and game over sounds) are generated programmatically using the Web Audio API. These are original works created for this game and are in the public domain.

**Drop Sound:**
- Descending sine wave tone
- Plays when a fruit is released

**Merge Sound:**
- Ascending chord progression
- Plays when two fruits successfully merge

**Game Over Sound:**
- Descending sawtooth wave
- Plays when the game ends

## Fruit Illustrations

The fruit illustrations were generated with Gemini using the exact prompt below. These illustrations are now actively used in the game to render all fruits.

**Usage in Game:**
- Displayed on the game canvas for all physics bodies (fruits that drop and merge)
- Shown in the preview area where the next fruit to drop is displayed
- Displayed in the "Next" indicator in the game header
- Featured in the fruit evolution progress bar
- Fallback to emoji rendering if images fail to load

**Fruit Mapping:**
- `1-blueberry.png` - Level 0 (smallest)
- `2-strawberry.png` - Level 1
- `6-grapes.png` - Level 2
- `5-orange.png` - Level 3
- `4-apple.png` - Level 4
- `3-lemon.png` - Level 5
- `7-cantaloupe.png` - Level 6
- `9-pineapple.png` - Level 7
- `8-coconut.png` - Level 8
- `10-watermelon.png` - Level 9 (largest)

**Image Generation Prompt:**
```text
A whimsical, charming, clean, and simple cartoon game icon of an [FRUIT NAME]. The fruit is a single, compact, softly spherical, whole, uncut object, ideal for a physics dropping game. It distinctly resembles a realistic fruit in its natural shape and form, rendered with vibrant, highly saturated, yet natural-looking colors (no unnatural hues), and a soft, playful light reflection to clearly show its roundness, without any white overlay or desaturation effect. It features a thin, clean, slightly imperfect dark stroke that IS the fruit's outermost boundary, with NO additional outer ring or white space. Minimal, essential internal detail, only enough to easily identify the fruit. Any natural elements like stems or leaves are tiny, simple, and seamlessly integrated/tucked extremely close to the fruit's body, ensuring the overall soft, round silhouette is maintained. The background is pure white.
```

## Other Assets

**Weave Textures:**
- `weave_background.png` - Background pattern
- `weave_bottom.jpg` - Bottom wall texture
- `weave_ends.jpg` - End wall texture
- `weave_sides.jpg` - Side wall texture

