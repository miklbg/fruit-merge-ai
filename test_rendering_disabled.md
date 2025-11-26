# Test Plan: Verify Rendering is Disabled During AI Training

## Feature Overview
The game should disable rendering during AI training to improve performance.

## Implementation
- File: `game/rl/game-api.js`
- Method: `setFastForwardMode(enabled)`
- Lines: 241-278

## Test Cases

### Test 1: Rendering Disabled During Training
**Steps:**
1. Open the game
2. Click "Menu" button
3. Click "🤖 AI Training"
4. Click "Start Training"

**Expected Results:**
- `game.Render.stop(game.render)` should be called
- `renderStopped` flag should be set to `true`
- Score display should be hidden (`display: 'none'`)
- Next fruit display should be hidden
- Preview fruit should be hidden
- Physics speed should be set to 10x (`engine.timing.timeScale = 10`)

### Test 2: Rendering Re-enabled After Training Stops
**Steps:**
1. Continue from Test 1
2. Click "Stop Training"

**Expected Results:**
- `game.Render.run(game.render)` should be called
- `renderStopped` flag should be set to `false`
- Score display should be visible (`display: ''`)
- Next fruit display should be visible
- Preview fruit should be visible
- Physics speed should be reset to 1x (`engine.timing.timeScale = 1`)

### Test 3: Rendering Enabled During AI Playback
**Steps:**
1. Open the game
2. Train AI (if not already trained)
3. Click "Watch AI Play"

**Expected Results:**
- Rendering should remain enabled
- Game should run at normal speed
- All UI elements should be visible
- User can see the AI playing in real-time

### Test 4: Rendering State Persists Correctly
**Steps:**
1. Start training
2. Wait a few seconds
3. Stop training
4. Start training again

**Expected Results:**
- Rendering should be disabled again
- No rendering artifacts or issues
- `renderStopped` flag should correctly track state

## Manual Verification

### Browser Console Tests
```javascript
// Check if rendering is stopped during training
console.log('Render stopped:', gameAPI.renderStopped);
console.log('Physics speed:', game.engine.timing.timeScale);
console.log('Score visible:', game.scoreEl.style.display);
```

### Performance Monitoring
- Monitor FPS during training (should be 0 or minimal)
- Monitor CPU usage (should be lower with rendering disabled)
- Monitor training speed (should be ~10x faster than real-time)

## Known Limitations
- Rendering state is managed by the `renderStopped` flag
- If game is restarted while training, rendering state should reset properly
- UI elements visibility is controlled separately from rendering

## Success Criteria
✅ All test cases pass
✅ Performance improvement is observable (lower CPU, faster training)
✅ No visual artifacts when toggling rendering on/off
✅ State management is consistent and predictable
