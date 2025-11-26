/**
 * RL Controller - Manages training and playback modes
 * Coordinates between the DQN agent and the game environment
 */

import { DQNAgent } from './dqn-agent.js';
import { GameEnvironment } from './game-environment.js';

export class RLController {
    constructor(gameAPI) {
        this.gameAPI = gameAPI;
        this.environment = new GameEnvironment(gameAPI);
        
        // Create DQN agent
        this.agent = new DQNAgent(
            this.environment.getStateSize(),
            this.environment.getActionSize(),
            {
                gamma: 0.95,
                epsilon: 1.0,
                epsilonMin: 0.01,
                epsilonDecay: 0.995,
                learningRate: 0.001,
                batchSize: 32,
                updateTargetEvery: 10,
                memorySize: 10000
            }
        );
        
        // Training state
        this.isTraining = false;
        this.isPlaying = false;
        this.isPaused = false;
        
        // Training optimization: train every N steps instead of every step
        this.trainEverySteps = 4; // Train once every 4 steps for better performance
        
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
            recentRewards: []
        };
        
        // Load saved statistics
        this.loadStats();
        
        // Callbacks
        this.onStatsUpdate = null;
        this.onTrainingComplete = null;
        this.onEpisodeEnd = null;
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
            // Training every step is expensive; training every few steps is more efficient
            if (this.agent.memory.length >= this.agent.batchSize && step % this.trainEverySteps === 0) {
                await this.agent.replay();
            }
            
            // Update state
            state = nextState;
            totalReward += reward;
            stepCount++;
            this.stats.totalSteps++;
            
            // Update current score
            const gameState = this.gameAPI.getGameState();
            this.stats.currentScore = gameState.score;
            
            // Update stats periodically (less frequently to reduce overhead)
            if (step % 20 === 0 && this.onStatsUpdate) {
                this.onStatsUpdate(this.stats);
            }
            
            if (done) {
                break;
            }
        }
        
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
                epsilon: this.agent.epsilon
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
        return {
            ...this.stats,
            agentStats: this.agent.getStats()
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
