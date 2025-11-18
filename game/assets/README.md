# Game Assets

This directory contains the graphic and audio assets for the Fruit Merge Game.

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

## Fruit Illustrations

The fruit illustrations were generated with Gemini using the exact prompt below. These illustrations are now actively used in the game to render all fruits.

**Usage in Game:**
- Displayed on the game canvas for all physics bodies (fruits that drop and merge)
- Shown in the preview area where the next fruit to drop is displayed
- Displayed in the "Next" indicator in the game header
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

```text
A whimsical, charming, clean, and simple cartoon game icon of an [FRUIT NAME]. The fruit is a single, compact, softly spherical, whole, uncut object, ideal for a physics dropping game. It distinctly resembles a realistic fruit in its natural shape and form, rendered with vibrant, highly saturated, yet natural-looking colors (no unnatural hues), and a soft, playful light reflection to clearly show its roundness, without any white overlay or desaturation effect. It features a thin, clean, slightly imperfect dark stroke that IS the fruit's outermost boundary, with NO additional outer ring or white space. Minimal, essential internal detail, only enough to easily identify the fruit. Any natural elements like stems or leaves are tiny, simple, and seamlessly integrated/tucked extremely close to the fruit's body, ensuring the overall soft, round silhouette is maintained. The background is pure white.
```
