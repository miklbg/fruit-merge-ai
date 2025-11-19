# Game Coordinate System Documentation

## Overview

The Fruit Merge Game uses a dual coordinate system to maintain consistent physics and rendering across different screen sizes.

## Coordinate Systems

### 1. Game World Coordinates
- **Fixed size:** 400px × 600px (width × height)
- **Aspect ratio:** 2:3
- **Purpose:** All physics simulations occur in this space
- **Physics bodies:** All fruits, walls, and game elements use these coordinates

### 2. Viewport Coordinates
- **Variable size:** Matches the canvas size on screen
- **Aspect ratio:** Always 2:3 (enforced by JavaScript)
- **Purpose:** Display rendering and user input
- **Scaling:** Matter.js automatically scales game world to fit viewport

## Coordinate Conversion

### Viewport → Game World
```javascript
function viewportToWorldX(viewportX) {
    return (viewportX / viewportWidth) * gameWorldWidth;
}

function viewportToWorldY(viewportY) {
    return (viewportY / viewportHeight) * gameWorldHeight;
}
```

**Use cases:**
- Converting mouse/touch input to game positions
- Determining where to drop fruits based on user clicks

### Game World → Viewport
```javascript
function worldToViewportX(worldX) {
    return (worldX / gameWorldWidth) * viewportWidth;
}

function worldToViewportY(worldY) {
    return (worldY / gameWorldHeight) * viewportHeight;
}
```

**Use cases:**
- Positioning preview elements (fruit preview)
- Spawning confetti effects at correct screen positions
- Displaying UI elements aligned with game objects

## Viewport Calculation

The viewport dimensions are calculated to maintain exact 2:3 aspect ratio:

```javascript
const headerHeight = headerEl.clientHeight;
const wrapperWidth = gameWrapper.clientWidth;
const wrapperHeight = gameWrapper.clientHeight;
const availableHeight = wrapperHeight - headerHeight;
const aspectRatio = gameWorldWidth / gameWorldHeight; // 2/3

if (wrapperWidth / availableHeight > aspectRatio) {
    // Width is limiting factor
    viewportWidth = Math.floor(availableHeight * aspectRatio);
    viewportHeight = availableHeight;
} else {
    // Height is limiting factor
    viewportWidth = wrapperWidth;
    viewportHeight = Math.floor(wrapperWidth / aspectRatio);
}
```

This ensures:
- No distortion when rendering
- Accurate coordinate conversions
- Consistent physics behavior
- Proper input handling

## Key Constants

```javascript
const NATIVE_WIDTH = 400;  // Game world width
const NATIVE_HEIGHT = 600; // Game world height
const gameWorldWidth = 400;
const gameWorldHeight = 600;
```

## Examples

### Example 1: Dropping a Fruit
```javascript
// User clicks at viewport coordinates (400, 100)
const viewportX = 400;
const worldX = viewportToWorldX(viewportX); // Convert to game world

// Create fruit body at game world coordinates
const fruit = createFruitBody(worldX, dropAreaY, fruitLevel);
```

### Example 2: Spawning Confetti
```javascript
// Merge happens at game world coordinates (200, 300)
const worldX = 200;
const worldY = 300;

// Convert to viewport for display
const viewportX = worldToViewportX(worldX);
const viewportY = worldToViewportY(worldY);

// Position confetti at viewport coordinates
confetti.style.left = `${viewportX}px`;
confetti.style.top = `${viewportY}px`;
```

### Example 3: Preview Fruit Positioning
```javascript
// Current position stored in game world coordinates
const worldX = currentPreviewX; // e.g., 200

// Convert to viewport for display
const viewportX = worldToViewportX(worldX);
const viewportCenterX = viewportWidth / 2;

// Position preview element
previewFruit.style.transform = `translateX(${viewportX - viewportCenterX}px) translateX(-50%)`;
```

## Testing

Run the test suite to verify coordinate calculations:
```bash
node test_aspect_ratio.js
```

Expected results:
- Aspect ratio error < 0.001
- Coordinate conversions with 100% accuracy
- All tests pass for various viewport sizes

## Best Practices

1. **Always store positions in game world coordinates**
   - Physics simulation uses game world
   - Makes the code scale-independent

2. **Convert to viewport only for display**
   - UI elements, confetti, previews
   - Mouse/touch input conversion

3. **Maintain 2:3 aspect ratio**
   - Ensures no distortion
   - Keeps physics consistent
   - Makes coordinate math predictable

4. **Use floor for integer pixels**
   - Prevents sub-pixel rendering issues
   - Keeps calculations consistent

## Troubleshooting

### Issue: Confetti appears at wrong position
- Check that `worldToViewportX/Y` is used to convert coordinates
- Verify confetti container has correct dimensions and position

### Issue: Fruit drops at wrong position
- Check that `viewportToWorldX` is used to convert mouse input
- Verify `currentPreviewX` is stored in game world coordinates

### Issue: Distorted rendering
- Verify viewport maintains 2:3 aspect ratio
- Check canvas dimensions match viewport dimensions
- Ensure render bounds are set to game world size (400×600)

## References

- Game world dimensions: `NATIVE_WIDTH` × `NATIVE_HEIGHT` (400×600)
- Viewport calculation: `initGame()` and `handleResize()` functions
- Coordinate conversions: `viewportToWorld*` and `worldToViewport*` functions
- Matter.js rendering: `render.bounds` settings
