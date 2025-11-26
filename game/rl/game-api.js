/**
 * Game API for Reinforcement Learning
 * Provides interface for RL system to interact with the game
 * This module is injected into the game and provides methods for:
 * - Getting game state
 * - Executing actions
 * - Resetting the game
 * - Fast-forward mode for training
 */

export class GameAPI {
    constructor() {
        // These will be set by the game
        this.gameInstance = null;
        this.fastForwardMode = false;
        
        // Fixed time step for physics simulation (1/60th of a second = ~16.67ms)
        // This ensures consistent physics behavior regardless of actual speed
        this.FIXED_DELTA_TIME = 1000 / 60;
        
        // Convert time-based cooldowns to simulation steps
        // At 60 FPS, 400ms = ~24 frames. We'll use 25 steps for safety
        this.DROP_COOLDOWN_STEPS = 25;
        // Reset cooldown: 200ms = ~12 frames at 60 FPS, use 10 steps
        this.RESET_COOLDOWN_STEPS = 10;
        
        // Step counters for cooldowns (replaces timeout-based approach)
        this.dropCooldownCounter = 0;
        this.resetCooldownCounter = 0;
        
        // Action queue for async execution
        this.actionQueue = [];
        this.isExecutingAction = false;
        this.actionResolveCallback = null;
        this.resetResolveCallback = null;
        
        // State tracking
        this.previousMaxFruitLevel = -1;
        this.previousScore = 0;
        
        // Rendering control
        this.renderStopped = false;
        this.runnerStopped = false;
        
        // Track simulation steps
        this.simulationStep = 0;
        
        // Manual simulation loop control
        this.manualLoopRunning = false;
        this.manualLoopTimeoutId = null;
        this.manualLoopCount = 0;  // Counter for loop iterations (for logging)
        
        // Batch size for manual simulation loop (number of physics updates per JS tick)
        // Higher = faster but less responsive, Lower = more responsive but slower
        this.SIMULATION_BATCH_SIZE = 10;
        
        // Track the last processed simulation step to prevent double-processing
        // This can happen when both the afterUpdate event and manual loop call onSimulationStep()
        this.lastProcessedStep = -1;
    }

    /**
     * Initialize the API with game instance
     * @param {Object} gameInstance - Reference to game state and functions
     */
    init(gameInstance) {
        this.gameInstance = gameInstance;
        this.previousMaxFruitLevel = gameInstance.currentGameMaxFruit || -1;
        this.previousScore = gameInstance.score || 0;
        
        // Hook into the game engine's afterUpdate event to track simulation steps
        // This is the primary mechanism for tracking physics updates in normal mode
        if (gameInstance.engine && gameInstance.Events) {
            gameInstance.Events.on(gameInstance.engine, 'afterUpdate', () => {
                this.onSimulationStep();
            });
        }
        
        // If fast-forward mode was already enabled, restart manual simulation loop
        // to use the new engine instance
        if (this.fastForwardMode) {
            // Stop any existing loop first (it may be using old engine reference)
            this.stopManualSimulationLoop();
            this.startManualSimulationLoop();
        }
    }
    
    /**
     * Called on each simulation step (physics update)
     * Decrements cooldown counters and processes pending actions
     * May be called from either the Matter.js afterUpdate event or the manual simulation loop
     */
    onSimulationStep() {
        // Increment simulation step counter first
        this.simulationStep++;
        
        // Check if we've already processed this step (prevents double-processing
        // when both afterUpdate event and manual loop call this method)
        if (this.simulationStep === this.lastProcessedStep) {
            return;
        }
        this.lastProcessedStep = this.simulationStep;
        
        // Decrement drop cooldown counter
        if (this.dropCooldownCounter > 0) {
            this.dropCooldownCounter--;
            
            // Check if action is waiting for cooldown to complete
            if (this.dropCooldownCounter === 0 && this.actionResolveCallback) {
                this.resolveCurrentAction();
            }
        }
        
        // Decrement reset cooldown counter
        if (this.resetCooldownCounter > 0) {
            this.resetCooldownCounter--;
            
            // Check if reset is waiting for cooldown to complete
            if (this.resetCooldownCounter === 0 && this.resetResolveCallback) {
                this.resetResolveCallback();
                this.resetResolveCallback = null;
            }
        }
    }

    /**
     * Get current game state as a structured object
     * @returns {Object} Game state
     */
    getGameState() {
        if (!this.gameInstance) {
            throw new Error('GameAPI not initialized');
        }
        
        const game = this.gameInstance;
        
        // Count fruits by level
        const fruitLevelCounts = new Array(10).fill(0);
        let fruitCount = 0;
        let totalY = 0;
        let maxY = 0; // Lowest Y position (remember Y increases downward)
        
        // Analyze fruits on screen
        if (game.world && game.world.bodies) {
            const fruits = game.world.bodies.filter(b => b.label === 'fruit');
            fruitCount = fruits.length;
            
            fruits.forEach(fruit => {
                if (fruit.fruitLevel !== undefined) {
                    fruitLevelCounts[fruit.fruitLevel]++;
                }
                totalY += fruit.position.y;
                maxY = Math.max(maxY, fruit.position.y);
            });
        }
        
        const avgFruitY = fruitCount > 0 ? totalY / fruitCount : 0;
        
        // Normalize Y positions (0 = top, 1 = bottom)
        const normalizedAvgY = avgFruitY / game.gameWorldHeight;
        const normalizedMaxY = maxY / game.gameWorldHeight;
        
        // Calculate fill level (how close fruits are to game over line)
        const gameOverLineY = game.gameOverLineY || (game.gameWorldHeight * 0.18);
        const fillLevel = Math.min(1, Math.max(0, 1 - (gameOverLineY / (maxY || game.gameWorldHeight))));
        
        // Time since last drop
        const timeSinceLastDrop = Date.now() - (game.lastDropTime || 0);
        
        return {
            score: game.score || 0,
            currentFruitLevel: game.currentFruitLevel || 0,
            nextFruitLevel: game.nextFruitLevel || 0,
            fruitCount,
            avgFruitY: normalizedAvgY,
            maxFruitY: normalizedMaxY,
            fruitLevelCounts,
            fillLevel,
            timeSinceLastDrop,
            boosterAvailable: (game.boosterUnlocked && game.boosterCooldownCount === 0) || false,
            warningActive: game.isWarningActive || false,
            gameOver: game.isGameOver || false
        };
    }

    /**
     * Execute an action (drop fruit at position)
     * @param {number} position - Normalized position (0-1) across the screen
     * @returns {Promise<Object>} Action result
     */
    async executeAction(position) {
        if (!this.gameInstance) {
            throw new Error('GameAPI not initialized');
        }
        
        return new Promise((resolve) => {
            this.actionQueue.push({ position, resolve });
            this.processActionQueue();
        });
    }

    /**
     * Process queued actions
     */
    async processActionQueue() {
        if (this.isExecutingAction || this.actionQueue.length === 0) {
            return;
        }
        
        this.isExecutingAction = true;
        const { position, resolve } = this.actionQueue.shift();
        
        const game = this.gameInstance;
        const previousScore = game.score || 0;
        const previousMaxFruitLevel = game.currentGameMaxFruit || -1;
        const previousFruitCount = game.world ? game.world.bodies.filter(b => b.label === 'fruit').length : 0;
        
        // Convert normalized position to game coordinates
        const gameWorldWidth = game.gameWorldWidth;
        const wallThickness = game.wallThickness || (game.BASE_WALL_THICKNESS || 120);
        const fruitData = game.FRUITS[game.currentFruitLevel];
        const radius = fruitData ? fruitData.baseRadius : 60;
        
        const minX = radius + wallThickness;
        const maxX = gameWorldWidth - radius - wallThickness;
        const targetX = minX + (maxX - minX) * position;
        
        // Move fruit to position
        game.currentPreviewX = targetX;
        if (game.moveFruit) {
            game.moveFruit(targetX, true);
        }
        
        // Drop the fruit
        if (game.dropFruit) {
            game.dropFruit();
        }
        
        // Store the resolve callback and wait for cooldown steps to complete
        this.actionResolveCallback = () => {
            const currentScore = game.score || 0;
            const currentMaxFruitLevel = game.currentGameMaxFruit || -1;
            const currentFruitCount = game.world ? game.world.bodies.filter(b => b.label === 'fruit').length : 0;
            
            const scoreGained = currentScore - previousScore;
            const mergeCount = Math.max(0, previousFruitCount - currentFruitCount + 1);
            
            const state = this.getGameState();
            
            const result = {
                scoreGained,
                mergeCount,
                fillLevel: state.fillLevel,
                gameOver: state.gameOver,
                maxFruitLevelAchieved: currentMaxFruitLevel,
                previousMaxFruitLevel
            };
            
            this.actionResolveCallback = null;
            this.isExecutingAction = false;
            resolve(result);
            
            // Process next action if any
            this.processActionQueue();
        };
        
        // In fast-forward mode, use step-based cooldown
        // In normal mode, still use timeout for visual feedback (game hasn't changed)
        if (this.fastForwardMode) {
            // Start cooldown counter - will be decremented in onSimulationStep()
            this.dropCooldownCounter = this.DROP_COOLDOWN_STEPS;
        } else {
            // Normal mode: use timeout for visual gameplay
            setTimeout(() => {
                if (this.actionResolveCallback) {
                    this.actionResolveCallback();
                }
            }, 800);
        }
    }
    
    /**
     * Resolve the current action when cooldown completes
     */
    resolveCurrentAction() {
        if (this.actionResolveCallback) {
            this.actionResolveCallback();
        }
    }

    /**
     * Reset the game to initial state
     * @returns {Promise<void>}
     */
    async resetGame() {
        if (!this.gameInstance) {
            throw new Error('GameAPI not initialized');
        }
        
        return new Promise((resolve) => {
            const game = this.gameInstance;
            
            // Clear any queued actions
            this.actionQueue = [];
            this.isExecutingAction = false;
            this.actionResolveCallback = null;
            this.resetResolveCallback = null;
            
            // Reset the game
            if (game.handleRestart) {
                game.handleRestart();
            }
            
            // Reset tracking
            this.previousMaxFruitLevel = -1;
            this.previousScore = 0;
            
            // In fast-forward mode, use step-based cooldown with callback
            // In normal mode, use timeout for visual reset
            if (this.fastForwardMode) {
                // Use the same callback pattern as drop actions for consistency
                this.resetResolveCallback = resolve;
                this.resetCooldownCounter = this.RESET_COOLDOWN_STEPS;
                // Callback will be triggered by onSimulationStep when counter reaches 0
            } else {
                // Normal mode: use timeout for visual reset
                setTimeout(() => {
                    resolve();
                }, 200);
            }
        });
    }

    /**
     * Check if game is over
     * @returns {boolean}
     */
    isGameOver() {
        return this.gameInstance ? (this.gameInstance.isGameOver || false) : false;
    }

    /**
     * Enable fast-forward mode for training
     * In fast-forward mode, we bypass the Runner and manually call Engine.update()
     * as fast as calculations finish (not tied to real-time or requestAnimationFrame)
     * @param {boolean} enabled
     */
    setFastForwardMode(enabled) {
        this.fastForwardMode = enabled;
        
        if (!this.gameInstance) {
            return;
        }
        
        const game = this.gameInstance;
        
        if (enabled) {
            // Stop rendering for performance - no visual updates needed during training
            if (game.render && game.Render && !this.renderStopped) {
                game.Render.stop(game.render);
                this.renderStopped = true;
            }
            // Hide UI updates for performance
            if (game.scoreEl) game.scoreEl.style.display = 'none';
            if (game.nextFruitImgEl) game.nextFruitImgEl.style.display = 'none';
            if (game.previewFruitEl) game.previewFruitEl.style.display = 'none';
            
            // Start manual simulation loop (runs as fast as possible)
            this.startManualSimulationLoop();
        } else {
            // Stop manual simulation loop
            this.stopManualSimulationLoop();
            
            // Resume rendering
            if (game.render && game.Render && this.renderStopped) {
                game.Render.run(game.render);
                this.renderStopped = false;
            }
            // Show UI
            if (game.scoreEl) game.scoreEl.style.display = '';
            if (game.nextFruitImgEl) game.nextFruitImgEl.style.display = '';
            if (game.previewFruitEl) game.previewFruitEl.style.display = '';
            
            // Restart the Runner for normal gameplay
            if (game.Runner && game.runner && game.engine && this.runnerStopped) {
                game.Runner.run(game.runner, game.engine);
                this.runnerStopped = false;
            }
        }
    }
    
    /**
     * Start manual simulation loop that runs as fast as calculations finish
     * Bypasses requestAnimationFrame and runs physics in a tight loop
     */
    startManualSimulationLoop() {
        if (this.manualLoopRunning) {
            return;
        }
        
        if (!this.gameInstance || !this.gameInstance.engine) {
            return;
        }
        
        // Stop the Runner to prevent double-updates
        if (this.gameInstance.Runner && this.gameInstance.runner && !this.runnerStopped) {
            this.gameInstance.Runner.stop(this.gameInstance.runner);
            this.runnerStopped = true;
        }
        
        this.manualLoopRunning = true;
        this.manualLoopCount = 0;  // Reset loop counter
        
        // Run simulation loop
        // Note: We use this.gameInstance inside the loop instead of capturing
        // a local variable, so that if init() is called with a new game instance,
        // the loop will automatically use the new engine.
        const runLoop = () => {
            if (!this.manualLoopRunning || !this.fastForwardMode) {
                return;
            }
            
            // Check if game instance is still valid
            if (!this.gameInstance || !this.gameInstance.engine) {
                // Stop the loop cleanly
                this.manualLoopRunning = false;
                this.manualLoopTimeoutId = null;
                return;
            }
            
            this.manualLoopCount++;
            
            // Run multiple physics updates per "tick" for maximum speed
            for (let i = 0; i < this.SIMULATION_BATCH_SIZE; i++) {
                // Manually update the physics engine with fixed time step
                // Matter.js Engine.update(engine, delta, correction)
                // delta: time step in milliseconds (default: 1000/60 ≈ 16.67ms)
                // correction: timing correction factor (default: 1, no correction)
                Matter.Engine.update(this.gameInstance.engine, this.FIXED_DELTA_TIME);
                
                // Manually call onSimulationStep after each physics update
                // This is needed because the Matter.js afterUpdate event may not fire
                // consistently when using manual Engine.update() calls, especially
                // after handleRestart() creates a new engine instance
                this.onSimulationStep();
            }
            
            // Use setTimeout(0) to yield to the event loop
            // This allows promises to resolve and prevents blocking
            this.manualLoopTimeoutId = setTimeout(runLoop, 0);
        };
        
        // Start the loop
        runLoop();
    }
    
    /**
     * Stop the manual simulation loop
     */
    stopManualSimulationLoop() {
        this.manualLoopRunning = false;
        if (this.manualLoopTimeoutId !== null) {
            clearTimeout(this.manualLoopTimeoutId);
            this.manualLoopTimeoutId = null;
        }
    }

    /**
     * Get reference to game instance (for debugging)
     * @returns {Object}
     */
    getGameInstance() {
        return this.gameInstance;
    }
}
