/**
 * Game Environment Wrapper for Reinforcement Learning
 * Provides a standard interface between the game and the RL agent
 */

export class GameEnvironment {
    constructor(gameAPI) {
        this.gameAPI = gameAPI;
        this.stateSize = 20; // State vector size
        this.actionSize = 20; // Number of discrete drop positions
    }

    /**
     * Get the current state of the game as a normalized vector
     * @returns {Float32Array} State vector
     */
    getState() {
        const state = new Float32Array(this.stateSize);
        const gameState = this.gameAPI.getGameState();
        
        // Normalize score (0-1 range, assuming max score ~10000)
        state[0] = Math.min(gameState.score / 10000, 1);
        
        // Current fruit level (0-9, normalized to 0-1)
        state[1] = gameState.currentFruitLevel / 9;
        
        // Next fruit level (0-9, normalized to 0-1)
        state[2] = gameState.nextFruitLevel / 9;
        
        // Number of fruits on screen (normalized, max ~20)
        state[3] = Math.min(gameState.fruitCount / 20, 1);
        
        // Average Y position of fruits (normalized, 0=top, 1=bottom)
        state[4] = gameState.avgFruitY;
        
        // Max Y position (highest fruit, indicates how full the container is)
        state[5] = gameState.maxFruitY;
        
        // Distribution of fruit levels (10 values, one per fruit type)
        for (let i = 0; i < 10; i++) {
            state[6 + i] = gameState.fruitLevelCounts[i] / 10; // Normalized count
        }
        
        // Container fill level (0-1, how close to game over)
        state[16] = gameState.fillLevel;
        
        // Time since last drop (normalized, 0-1)
        state[17] = Math.min(gameState.timeSinceLastDrop / 5000, 1);
        
        // Booster availability (0 or 1)
        state[18] = gameState.boosterAvailable ? 1 : 0;
        
        // Warning active (0 or 1)
        state[19] = gameState.warningActive ? 1 : 0;
        
        return state;
    }

    /**
     * Execute an action in the game
     * @param {number} action - Action index (0 to actionSize-1)
     * @returns {Object} Result containing nextState, reward, done
     */
    async step(action) {
        // Convert action to drop position (0-19 maps to positions across the screen)
        const position = (action + 0.5) / this.actionSize; // 0.025 to 0.975
        
        // Execute the drop
        const result = await this.gameAPI.executeAction(position);
        
        // Get next state
        const nextState = this.getState();
        
        // Calculate reward
        const reward = this.calculateReward(result);
        
        return {
            nextState,
            reward,
            done: result.gameOver
        };
    }

    /**
     * Calculate reward based on game result
     * @param {Object} result - Result from game action
     * @returns {number} Reward value
     */
    calculateReward(result) {
        let reward = 0;
        
        // Base reward: small negative to encourage efficiency
        reward -= 0.1;
        
        // Reward for score increase
        if (result.scoreGained > 0) {
            reward += result.scoreGained / 100; // Scale down score
        }
        
        // Bonus for merges (encourages combining fruits)
        if (result.mergeCount > 0) {
            reward += result.mergeCount * 2;
        }
        
        // Penalty for filling up the container
        if (result.fillLevel > 0.8) {
            reward -= (result.fillLevel - 0.8) * 10; // Increasing penalty
        }
        
        // Large penalty for game over
        if (result.gameOver) {
            reward -= 100;
        }
        
        // Bonus for creating higher level fruits
        if (result.maxFruitLevelAchieved > result.previousMaxFruitLevel) {
            reward += (result.maxFruitLevelAchieved - result.previousMaxFruitLevel) * 10;
        }
        
        return reward;
    }

    /**
     * Reset the game to initial state
     * @returns {Float32Array} Initial state
     */
    async reset() {
        await this.gameAPI.resetGame();
        return this.getState();
    }

    /**
     * Check if the game is over
     * @returns {boolean}
     */
    isGameOver() {
        return this.gameAPI.isGameOver();
    }

    /**
     * Get action size
     * @returns {number}
     */
    getActionSize() {
        return this.actionSize;
    }

    /**
     * Get state size
     * @returns {number}
     */
    getStateSize() {
        return this.stateSize;
    }
}
