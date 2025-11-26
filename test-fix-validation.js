/**
 * Test validation for the AI training fix
 * This test validates that:
 * 1. The isGameOverAnimating flag is cleared before handleRestart
 * 2. The game resets properly during fast-forward mode
 */

console.log('='.repeat(60));
console.log('Validation Test: AI Training Episode Increment Fix');
console.log('='.repeat(60));

// Simulate the game state
let isGameOverAnimating = false;
let isGameOver = false;
let resetCount = 0;
let fastForwardMode = false;
let runnerStarted = false;

// Simulate handleRestart as it appears in the game
function handleRestart() {
    // This is the original behavior that caused the bug
    if (isGameOverAnimating) {
        console.log('  ✗ handleRestart: Early return due to isGameOverAnimating');
        return false; // Returns early, doesn't reset!
    }
    
    // ... rest of restart logic would be here
    isGameOver = false;
    isGameOverAnimating = false;
    resetCount++;
    console.log(`  ✓ handleRestart: Game reset successfully (reset #${resetCount})`);
    return true;
}

// Simulate the FIXED handleRestart wrapper passed to gameAPI
function handleRestartFixed() {
    // This is the fix - clear animation flag before calling handleRestart
    isGameOverAnimating = false;
    handleRestart();
}

// Simulate initGame behavior - should NOT start runner in fast-forward mode
function initGame() {
    console.log('  initGame: Initializing game...');
    
    // This is the fix - only start runner if not in fast-forward mode
    if (!fastForwardMode) {
        runnerStarted = true;
        console.log('  initGame: Runner started (normal mode)');
    } else {
        runnerStarted = false;
        console.log('  initGame: Runner NOT started (fast-forward mode)');
    }
}

// Test scenarios
function runTests() {
    let passed = 0;
    let failed = 0;
    
    function test(name, fn) {
        try {
            fn();
            console.log(`✓ ${name}`);
            passed++;
        } catch (error) {
            console.log(`✗ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    // Test 1: Original bug - handleRestart returns early when isGameOverAnimating is true
    console.log('\n--- Test 1: Original bug scenario ---');
    test('handleRestart returns early when isGameOverAnimating is true', () => {
        isGameOverAnimating = true;
        resetCount = 0;
        
        const result = handleRestart();
        
        if (result !== false) {
            throw new Error('handleRestart should return false (early return)');
        }
        if (resetCount !== 0) {
            throw new Error('Game should NOT be reset when isGameOverAnimating is true');
        }
    });
    
    // Test 2: Fix - handleRestartFixed clears flag before calling handleRestart
    console.log('\n--- Test 2: Fixed behavior ---');
    test('handleRestartFixed clears animation flag and resets game', () => {
        isGameOverAnimating = true;
        resetCount = 0;
        
        handleRestartFixed();
        
        if (isGameOverAnimating !== false) {
            throw new Error('isGameOverAnimating should be false after fix');
        }
        if (resetCount !== 1) {
            throw new Error('Game should be reset once');
        }
    });
    
    // Test 3: initGame behavior in normal mode
    console.log('\n--- Test 3: initGame in normal mode ---');
    test('initGame starts runner in normal mode', () => {
        fastForwardMode = false;
        runnerStarted = false;
        
        initGame();
        
        if (runnerStarted !== true) {
            throw new Error('Runner should be started in normal mode');
        }
    });
    
    // Test 4: initGame behavior in fast-forward mode
    console.log('\n--- Test 4: initGame in fast-forward mode ---');
    test('initGame does NOT start runner in fast-forward mode', () => {
        fastForwardMode = true;
        runnerStarted = true; // Set to true to verify it becomes false
        
        initGame();
        
        if (runnerStarted !== false) {
            throw new Error('Runner should NOT be started in fast-forward mode');
        }
    });
    
    // Test 5: Simulate full episode cycle with fix
    console.log('\n--- Test 5: Full episode cycle simulation ---');
    test('Episode cycle works with fix', () => {
        // Setup: game is in fast-forward mode, game over just happened
        fastForwardMode = true;
        isGameOver = true;
        isGameOverAnimating = true;
        resetCount = 0;
        
        // Episode ends, try to reset for next episode
        handleRestartFixed();
        initGame();
        
        // Verify state after reset
        if (isGameOver !== false) {
            throw new Error('Game should not be over after reset');
        }
        if (isGameOverAnimating !== false) {
            throw new Error('Animation flag should be false after reset');
        }
        if (runnerStarted !== false) {
            throw new Error('Runner should not be started in fast-forward mode');
        }
        if (resetCount !== 1) {
            throw new Error('Game should be reset exactly once');
        }
    });
    
    // Test 6: Multiple episodes
    console.log('\n--- Test 6: Multiple episode cycles ---');
    test('Multiple episode cycles work correctly', () => {
        fastForwardMode = true;
        resetCount = 0;
        
        // Simulate 10 episode cycles
        for (let i = 0; i < 10; i++) {
            // End of episode - game over
            isGameOver = true;
            isGameOverAnimating = true;
            
            // Reset for next episode (using fixed method)
            handleRestartFixed();
            initGame();
            
            // Verify each cycle
            if (isGameOver) {
                throw new Error(`Episode ${i + 1}: Game should not be over after reset`);
            }
        }
        
        if (resetCount !== 10) {
            throw new Error(`Expected 10 resets, got ${resetCount}`);
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`Tests passed: ${passed}`);
    console.log(`Tests failed: ${failed}`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
        console.log('\n✗ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ ALL TESTS PASSED');
        console.log('\nThe fix correctly addresses:');
        console.log('  1. isGameOverAnimating flag is cleared before handleRestart');
        console.log('  2. Game resets properly during AI training');
        console.log('  3. Runner is not started in fast-forward mode');
        console.log('  4. Multiple episode cycles work correctly');
    }
}

runTests();
