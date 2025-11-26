/**
 * RL Controller - Manages training and playback modes
 * Coordinates between the DQN agent and the game environment
 * 
 * Optimizations:
 * - Uses optimized DQN agent with Double DQN, PER, and learning rate scheduling
 * - Configurable training frequency for performance tuning
 * - Supports turbo mode for maximum simulation speed
 */

import { DQNAgent } from './dqn-agent.js';
import { GameEnvironment } from './game-environment.js';

export class RLController {
    constructor(gameAPI) {
        this.gameAPI = gameAPI;
        this.environment = new GameEnvironment(gameAPI);
        
        // Create DQN agent with optimized hyperparameters
        this.agent = new DQNAgent(
            this.environment.getStateSize(),
            this.environment.getActionSize(),
            {
                // Improved hyperparameters for better learning
                gamma: 0.99,              // Higher discount for long-term planning
                epsilon: 1.0,
                epsilonMin: 0.05,         // Higher min for continued exploration
                epsilonDecay: 0.997,      // Slower decay
                learningRate: 0.0005,     // Lower LR for stability
                learningRateMin: 0.00001,
                learningRateDecay: 0.9995,
                batchSize: 64,            // Larger batch for stable gradients
                updateTargetEvery: 5,     // More frequent updates
                memorySize: 50000,        // Larger buffer
                
                // Advanced optimizations
                useDoubleDQN: true,
                usePER: true,
                useSoftUpdate: true,
                tau: 0.005                // Soft update coefficient
            }
        );
        
        // Training state
        this.isTraining = false;
        this.isPlaying = false;
        this.isPaused = false;
        
        // Training optimization: train every N steps instead of every step
        // Reduced from 4 to 2 for more frequent learning with larger batches
        this.trainEverySteps = 2;
        
        // Statistics
        // Note: totalEpisodes and totalSteps are cumulative across all training sessions
        // They persist in localStorage and continue to grow as the model is trained
        this.stats = {
            totalEpisodes: 0,
            totalSteps: 0,
            bestScore: 0,
            currentEpisode: 0,
            currentScore: 0,
            averageScore: 0,
            recentScores: [],
            averageReward: 0,
            recentRewards: [],
            stepsPerSecond: 0,
            lastStepTime: 0
        };
        
        // Load saved statistics
        this.loadStats();
        
        // Callbacks
        this.onStatsUpdate = null;
        this.onTrainingComplete = null;
        this.onEpisodeEnd = null;
        
        // Performance tracking
        this._stepStartTime = 0;
        this._stepsInLastSecond = 0;
        this._lastSpeedUpdate = 0;
    }

    /**
     * Load statistics from localStorage
     */
    loadStats() {
        try {
            const savedStats = localStorage.getItem('fruit-merge-rl-stats');
            if (savedStats) {
                const parsed = JSON.parse(savedStats);
                this.stats = {
                    ...this.stats,
                    ...parsed
                };
            }
        } catch (error) {
            console.error('Failed to load RL stats:', error);
        }
    }

    /**
     * Save statistics to localStorage
     */
    saveStats() {
        try {
            localStorage.setItem('fruit-merge-rl-stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Failed to save RL stats:', error);
        }
    }

    /**
     * Start training the agent
     * @param {number} episodes - Number of episodes to train
     * @param {number} maxSteps - Max steps per episode
     */
    async startTraining(episodes = 1000, maxSteps = 500) {
        if (this.isTraining) {
            console.warn('Training already in progress');
            return;
        }
        
        this.isTraining = true;
        this.isPaused = false;
        
        // Try to load existing model to continue training
        await this.agent.loadModel();
        
        // Training loop
        for (let episode = 0; episode < episodes && this.isTraining; episode++) {
            if (this.isPaused) {
                // Wait while paused
                await new Promise(resolve => setTimeout(resolve, 100));
                episode--;
                continue;
            }
            
            await this.runEpisode(episode, maxSteps);
            
            // Save model periodically
            if ((episode + 1) % 10 === 0) {
                await this.agent.saveModel();
            }
        }
        
        // Final save
        if (this.isTraining) {
            await this.agent.saveModel();
            this.saveStats();
            this.isTraining = false;
            
            if (this.onTrainingComplete) {
                this.onTrainingComplete(this.stats);
            }
        }
    }

    /**
     * Run a single training episode
     * @param {number} episode - Episode number
     * @param {number} maxSteps - Maximum steps
     */
    async runEpisode(episode, maxSteps) {
        // Reset environment
        let state = await this.environment.reset();
        let totalReward = 0;
        let stepCount = 0;
        
        this.stats.currentEpisode = episode + 1;
        this.stats.currentScore = 0;
        
        // Track episode start time for speed calculation
        const episodeStartTime = performance.now();
        
        for (let step = 0; step < maxSteps; step++) {
            if (!this.isTraining || this.isPaused) {
                break;
            }
            
            // Select action
            const action = await this.agent.selectAction(state);
            
            // Execute action
            const { nextState, reward, done } = await this.environment.step(action);
            
            // Store experience
            this.agent.remember(state, action, reward, nextState, done);
            
            // Train the agent periodically (every N steps) for better performance
            if (this.agent.memory.length >= this.agent.batchSize && step % this.trainEverySteps === 0) {
                await this.agent.replay();
            }
            
            // Update state
            state = nextState;
            totalReward += reward;
            stepCount++;
            this.stats.totalSteps++;
            this._stepsInLastSecond++;
            
            // Update speed calculation every second
            const now = performance.now();
            if (now - this._lastSpeedUpdate >= 1000) {
                this.stats.stepsPerSecond = this._stepsInLastSecond;
                this._stepsInLastSecond = 0;
                this._lastSpeedUpdate = now;
            }
            
            // Update current score
            const gameState = this.gameAPI.getGameState();
            this.stats.currentScore = gameState.score;
            
            // Update stats less frequently to reduce overhead (every 50 steps instead of 20)
            if (step % 50 === 0 && this.onStatsUpdate) {
                this.onStatsUpdate(this.stats);
            }
            
            if (done) {
                break;
            }
        }
        
        // Calculate episode duration
        const episodeDuration = (performance.now() - episodeStartTime) / 1000;
        
        // End of episode
        this.agent.endEpisode();
        this.stats.totalEpisodes++;
        
        // Update statistics
        const finalScore = this.gameAPI.getGameState().score;
        this.stats.recentScores.push(finalScore);
        if (this.stats.recentScores.length > 100) {
            this.stats.recentScores.shift();
        }
        
        this.stats.recentRewards.push(totalReward);
        if (this.stats.recentRewards.length > 100) {
            this.stats.recentRewards.shift();
        }
        
        this.stats.averageScore = this.stats.recentScores.reduce((a, b) => a + b, 0) / this.stats.recentScores.length;
        this.stats.averageReward = this.stats.recentRewards.reduce((a, b) => a + b, 0) / this.stats.recentRewards.length;
        
        if (finalScore > this.stats.bestScore) {
            this.stats.bestScore = finalScore;
        }
        
        // Callbacks
        if (this.onEpisodeEnd) {
            this.onEpisodeEnd({
                episode: episode + 1,
                score: finalScore,
                steps: stepCount,
                reward: totalReward,
                epsilon: this.agent.epsilon,
                duration: episodeDuration,
                stepsPerSecond: stepCount / episodeDuration
            });
        }
        
        if (this.onStatsUpdate) {
            this.onStatsUpdate(this.stats);
        }
        
        // Save stats every 10 episodes
        if ((episode + 1) % 10 === 0) {
            this.saveStats();
        }
    }

    /**
     * Start AI playback mode (watch trained agent play)
     */
    async startPlayback() {
        if (this.isPlaying) {
            console.warn('Playback already in progress');
            return;
        }
        
        // Load trained model
        const modelLoaded = await this.agent.loadModel();
        if (!modelLoaded) {
            console.error('No trained model found');
            return false;
        }
        
        this.isPlaying = true;
        this.isPaused = false;
        
        // Reset environment
        let state = await this.environment.reset();
        
        // Playback loop
        while (this.isPlaying && !this.environment.isGameOver()) {
            if (this.isPaused) {
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }
            
            // Select best action (no exploration)
            const action = await this.agent.selectBestAction(state);
            
            // Execute action at normal game speed
            const { nextState } = await this.environment.step(action);
            
            state = nextState;
            
            // Small delay for human-viewable speed
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        this.isPlaying = false;
        return true;
    }

    /**
     * Stop training
     */
    async stopTraining() {
        this.isTraining = false;
        // Save current progress
        await this.agent.saveModel();
        // Save statistics
        this.saveStats();
    }

    /**
     * Stop playback
     */
    stopPlayback() {
        this.isPlaying = false;
    }

    /**
     * Pause training or playback
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume training or playback
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Check if a trained model exists
     * @returns {Promise<boolean>}
     */
    async hasTrainedModel() {
        return await this.agent.modelExists();
    }

    /**
     * Get current statistics
     * @returns {Object}
     */
    getStats() {
        const simStats = this.gameAPI.getSimulationStats ? this.gameAPI.getSimulationStats() : {};
        return {
            ...this.stats,
            agentStats: this.agent.getStats(),
            simulationStats: simStats
        };
    }

    /**
     * Reset all training data
     */
    async resetTraining() {
        // Create new agent
        this.agent.dispose();
        this.agent = new DQNAgent(
            this.environment.getStateSize(),
            this.environment.getActionSize()
        );
        
        // Reset stats
        this.stats = {
            totalEpisodes: 0,
            totalSteps: 0,
            bestScore: 0,
            currentEpisode: 0,
            currentScore: 0,
            averageScore: 0,
            recentScores: [],
            averageReward: 0,
            recentRewards: []
        };
        
        // Clear saved stats
        localStorage.removeItem('fruit-merge-rl-stats');
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.stopTraining();
        this.stopPlayback();
        this.agent.dispose();
    }
}
