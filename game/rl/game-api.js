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
        // Physics speed multiplier for training - 20x provides maximum training speed
        // while maintaining physics accuracy
        this.TRAINING_PHYSICS_SPEED = 20;
        
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
        
        // State tracking
        this.previousMaxFruitLevel = -1;
        this.previousScore = 0;
        
        // Rendering control
        this.renderStopped = false;
        
        // Track simulation steps
        this.simulationStep = 0;
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
        if (gameInstance.engine && gameInstance.Events) {
            gameInstance.Events.on(gameInstance.engine, 'afterUpdate', () => {
                this.onSimulationStep();
            });
        }
    }
    
    /**
     * Called on each simulation step (physics update)
     * Decrements cooldown counters and processes pending actions
     */
    onSimulationStep() {
        this.simulationStep++;
        
        // Decrement cooldown counters
        if (this.dropCooldownCounter > 0) {
            this.dropCooldownCounter--;
            
            // Check if action is waiting for cooldown to complete
            if (this.dropCooldownCounter === 0 && this.actionResolveCallback) {
                this.resolveCurrentAction();
            }
        }
        
        if (this.resetCooldownCounter > 0) {
            this.resetCooldownCounter--;
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
            
            // Reset the game
            if (game.handleRestart) {
                game.handleRestart();
            }
            
            // Reset tracking
            this.previousMaxFruitLevel = -1;
            this.previousScore = 0;
            
            // In fast-forward mode, use step-based cooldown
            // In normal mode, use timeout for visual reset
            if (this.fastForwardMode) {
                // Start reset cooldown counter
                this.resetCooldownCounter = this.RESET_COOLDOWN_STEPS;
                
                // Wait for cooldown to complete by polling
                const checkReset = () => {
                    if (this.resetCooldownCounter === 0) {
                        resolve();
                    } else {
                        // Check again on next animation frame (or immediately if no RAF)
                        if (typeof requestAnimationFrame !== 'undefined') {
                            requestAnimationFrame(checkReset);
                        } else {
                            setTimeout(checkReset, 0);
                        }
                    }
                };
                checkReset();
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
     * @param {boolean} enabled
     */
    setFastForwardMode(enabled) {
        this.fastForwardMode = enabled;
        
        if (!this.gameInstance) return;
        
        const game = this.gameInstance;
        
        if (enabled) {
            // Speed up physics using engine.timing.timeScale
            // This is the proper way to speed up Matter.js physics without breaking mechanics
            if (game.engine) {
                game.engine.timing.timeScale = this.TRAINING_PHYSICS_SPEED;
            }
            // Stop rendering for performance - no visual updates needed during training
            if (game.render && game.Render && !this.renderStopped) {
                game.Render.stop(game.render);
                this.renderStopped = true;
            }
            // Hide UI updates for performance
            if (game.scoreEl) game.scoreEl.style.display = 'none';
            if (game.nextFruitImgEl) game.nextFruitImgEl.style.display = 'none';
            if (game.previewFruitEl) game.previewFruitEl.style.display = 'none';
        } else {
            // Normal speed
            if (game.engine) {
                game.engine.timing.timeScale = 1; // Reset to normal speed
            }
            // Resume rendering
            if (game.render && game.Render && this.renderStopped) {
                game.Render.run(game.render);
                this.renderStopped = false;
            }
            // Show UI
            if (game.scoreEl) game.scoreEl.style.display = '';
            if (game.nextFruitImgEl) game.nextFruitImgEl.style.display = '';
            if (game.previewFruitEl) game.previewFruitEl.style.display = '';
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
