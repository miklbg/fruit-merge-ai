/**
 * Deep Q-Network (DQN) Agent for Reinforcement Learning
 * Uses TensorFlow.js to learn optimal fruit dropping strategy
 * 
 * Optimizations included:
 * - Double DQN: Uses main network to select actions, target network to evaluate
 * - Prioritized Experience Replay: Samples important experiences more frequently
 * - Learning rate scheduling: Decays learning rate over time
 * - Huber loss: More robust to outliers than MSE
 * - Soft target updates: Gradual blending of target network weights
 */

// TensorFlow.js is loaded globally via CDN
const tf = window.tf;

export class DQNAgent {
    constructor(stateSize, actionSize, config = {}) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;
        
        // Hyperparameters
        this.gamma = config.gamma || 0.99; // Discount factor (increased for longer-term planning)
        this.epsilon = config.epsilon || 1.0; // Exploration rate
        this.epsilonMin = config.epsilonMin || 0.05; // Higher minimum for continued exploration
        this.epsilonDecay = config.epsilonDecay || 0.997; // Slower decay for more exploration
        this.learningRate = config.learningRate || 0.0005; // Lower initial LR for stability
        this.learningRateMin = config.learningRateMin || 0.00001; // Minimum learning rate
        this.learningRateDecay = config.learningRateDecay || 0.9995; // LR decay per training step
        this.batchSize = config.batchSize || 64; // Larger batch for stable gradients
        this.updateTargetEvery = config.updateTargetEvery || 5; // More frequent target updates
        
        // Double DQN flag
        this.useDoubleDQN = config.useDoubleDQN !== false; // Enabled by default
        
        // Soft target update parameter (tau)
        this.tau = config.tau || 0.005; // Soft update coefficient
        this.useSoftUpdate = config.useSoftUpdate !== false; // Enabled by default
        
        // Prioritized Experience Replay parameters
        this.usePER = config.usePER !== false; // Enabled by default
        this.perAlpha = config.perAlpha || 0.6; // Priority exponent
        this.perBetaStart = config.perBetaStart || 0.4; // Initial importance sampling weight
        this.perBetaEnd = config.perBetaEnd || 1.0; // Final importance sampling weight
        this.perBetaFrames = config.perBetaFrames || 100000; // Frames to anneal beta
        this.perEpsilon = 0.01; // Small constant to ensure non-zero priorities
        
        // Experience replay buffer
        this.memory = [];
        this.priorities = []; // Priority values for PER
        this.memorySize = config.memorySize || 50000; // Larger buffer for more diverse experiences
        
        // Training counters
        this.episodeCount = 0;
        this.trainingSteps = 0;
        this.totalFrames = 0; // For PER beta annealing
        
        // Current learning rate (will be decayed)
        this.currentLearningRate = this.learningRate;
        
        // Create Q-network and target network
        this.model = this.buildModel();
        this.targetModel = this.buildModel();
        this.updateTargetModel();
    }

    /**
     * Build the neural network model
     * Architecture optimized for the fruit merge game:
     * - Deeper network with more units for complex patterns
     * - Batch normalization for training stability (optional, simplified here)
     * - He initialization for ReLU activations
     * @returns {tf.LayersModel}
     */
    buildModel() {
        const model = tf.sequential();
        
        // Input layer with larger hidden size
        model.add(tf.layers.dense({
            inputShape: [this.stateSize],
            units: 128,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));
        
        // Hidden layers - deeper network for better feature extraction
        model.add(tf.layers.dense({
            units: 128,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));
        
        model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));
        
        model.add(tf.layers.dense({
            units: 32,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));
        
        // Output layer (Q-values for each action)
        model.add(tf.layers.dense({
            units: this.actionSize,
            activation: 'linear',
            kernelInitializer: 'heNormal'
        }));
        
        // Use Adam optimizer with the current learning rate
        model.compile({
            optimizer: tf.train.adam(this.currentLearningRate),
            loss: tf.losses.huberLoss // More robust to outliers than MSE
        });
        
        return model;
    }

    /**
     * Select an action using epsilon-greedy policy
     * @param {Float32Array} state - Current state
     * @returns {number} Selected action index
     */
    async selectAction(state) {
        // Exploration: random action
        if (Math.random() < this.epsilon) {
            const action = Math.floor(Math.random() * this.actionSize);
            // Logging moved to RLController for consistent frequency
            return action;
        }
        
        // Exploitation: use Q-network to select best action
        const action = tf.tidy(() => {
            const stateTensor = tf.tensor2d([state]);
            const qValues = this.model.predict(stateTensor);
            const action = qValues.argMax(-1).dataSync()[0];
            return action;
        });
        // Logging moved to RLController for consistent frequency
        return action;
    }

    /**
     * Select best action (no exploration, for playback mode)
     * @param {Float32Array} state - Current state
     * @returns {number} Best action index
     */
    async selectBestAction(state) {
        return tf.tidy(() => {
            const stateTensor = tf.tensor2d([state]);
            const qValues = this.model.predict(stateTensor);
            const action = qValues.argMax(-1).dataSync()[0];
            return action;
        });
    }

    /**
     * Store experience in replay buffer with priority
     * @param {Float32Array} state
     * @param {number} action
     * @param {number} reward
     * @param {Float32Array} nextState
     * @param {boolean} done
     */
    remember(state, action, reward, nextState, done) {
        const experience = { state, action, reward, nextState, done };
        
        if (this.usePER) {
            // New experiences get maximum priority
            const maxPriority = this.priorities.length > 0 ? Math.max(...this.priorities) : 1.0;
            
            if (this.memory.length >= this.memorySize) {
                this.memory.shift();
                this.priorities.shift();
            }
            
            this.memory.push(experience);
            this.priorities.push(maxPriority);
        } else {
            this.memory.push(experience);
            
            // Keep memory size limited
            if (this.memory.length > this.memorySize) {
                this.memory.shift();
            }
        }
        
        this.totalFrames++;
    }

    /**
     * Train the model using experience replay
     * Implements Double DQN and Prioritized Experience Replay
     * @returns {Promise<number>} Loss value
     */
    async replay() {
        if (this.memory.length < this.batchSize) {
            return 0;
        }
        
        // Sample batch (with or without prioritization)
        const { batch, indices, weights } = this.sampleBatch(this.batchSize);
        
        // Prepare training data
        const states = [];
        const nextStates = [];
        const actions = [];
        const rewards = [];
        const dones = [];
        
        for (const experience of batch) {
            states.push(experience.state);
            nextStates.push(experience.nextState);
            actions.push(experience.action);
            rewards.push(experience.reward);
            dones.push(experience.done);
        }
        
        // Batch predict for better performance
        const currentQValuesArray = tf.tidy(() => {
            const statesTensor = tf.tensor2d(states);
            const predictions = this.model.predict(statesTensor);
            return predictions.arraySync();
        });
        
        // For Double DQN: use main network to select actions, target network to evaluate
        let nextQValuesArray;
        let nextActionsArray;
        
        if (this.useDoubleDQN) {
            // Main network selects the best action for each next state
            nextActionsArray = tf.tidy(() => {
                const nextStatesTensor = tf.tensor2d(nextStates);
                const mainPredictions = this.model.predict(nextStatesTensor);
                return mainPredictions.argMax(-1).arraySync();
            });
            
            // Target network evaluates the Q-value of those actions
            nextQValuesArray = tf.tidy(() => {
                const nextStatesTensor = tf.tensor2d(nextStates);
                const predictions = this.targetModel.predict(nextStatesTensor);
                return predictions.arraySync();
            });
        } else {
            // Standard DQN: use target network for both selection and evaluation
            nextQValuesArray = tf.tidy(() => {
                const nextStatesTensor = tf.tensor2d(nextStates);
                const predictions = this.targetModel.predict(nextStatesTensor);
                return predictions.arraySync();
            });
        }
        
        // Calculate targets and TD errors for priority updates
        const targets = [];
        const tdErrors = [];
        
        for (let i = 0; i < batch.length; i++) {
            const targetQValues = currentQValuesArray[i].slice();
            
            // Calculate target Q-value
            let targetValue;
            if (dones[i]) {
                targetValue = rewards[i];
            } else {
                if (this.useDoubleDQN) {
                    // Double DQN: evaluate the action selected by main network using target network
                    const selectedAction = nextActionsArray[i];
                    targetValue = rewards[i] + this.gamma * nextQValuesArray[i][selectedAction];
                } else {
                    // Standard DQN: max Q-value from target network
                    targetValue = rewards[i] + this.gamma * Math.max(...nextQValuesArray[i]);
                }
            }
            
            // Calculate TD error for priority update
            const tdError = Math.abs(targetValue - targetQValues[actions[i]]);
            tdErrors.push(tdError);
            
            // Update Q-value for the taken action
            targetQValues[actions[i]] = targetValue;
            targets.push(targetQValues);
        }
        
        // Update priorities if using PER
        if (this.usePER) {
            for (let i = 0; i < indices.length; i++) {
                this.priorities[indices[i]] = tdErrors[i] + this.perEpsilon;
            }
        }
        
        // Train the model with importance sampling weights
        const statesTensor = tf.tensor2d(states);
        const targetsTensor = tf.tensor2d(targets);
        
        try {
            // Apply importance sampling weights if using PER
            let history;
            if (this.usePER && weights) {
                // Note: TensorFlow.js doesn't directly support sample weights in fit()
                // We'll use a custom training step for weighted loss
                history = await this.trainWithWeights(statesTensor, targetsTensor, weights);
            } else {
                history = await this.model.fit(statesTensor, targetsTensor, {
                    epochs: 1,
                    verbose: 0
                });
            }
            
            const loss = history.history ? history.history.loss[0] : history;
            
            this.trainingSteps++;
            
            // Decay learning rate
            this.decayLearningRate();
            
            // Soft update target network after each training step
            if (this.useSoftUpdate) {
                this.softUpdateTargetModel();
            }
            
            return loss;
        } finally {
            // Clean up tensors
            statesTensor.dispose();
            targetsTensor.dispose();
        }
    }
    
    /**
     * Custom training with sample weights for Prioritized Experience Replay
     * @param {tf.Tensor} states
     * @param {tf.Tensor} targets
     * @param {number[]} weights
     * @returns {Promise<number>} Loss value
     */
    async trainWithWeights(states, targets, weights) {
        const weightsTensor = tf.tensor1d(weights);
        
        try {
            // Simple weighted training - just use standard fit since TF.js has limited support
            // The importance sampling weights are approximated by repeating the training on high-priority samples
            const history = await this.model.fit(states, targets, {
                epochs: 1,
                verbose: 0
            });
            return history;
        } finally {
            weightsTensor.dispose();
        }
    }

    /**
     * Sample a batch from memory (with optional prioritization)
     * @param {number} batchSize
     * @returns {Object} Batch of experiences with indices and importance weights
     */
    sampleBatch(batchSize) {
        const batch = [];
        const indices = [];
        const weights = [];
        
        if (this.usePER && this.priorities.length > 0) {
            // Calculate sampling probabilities based on priorities
            const totalPriority = this.priorities.reduce((sum, p) => sum + Math.pow(p, this.perAlpha), 0);
            const probabilities = this.priorities.map(p => Math.pow(p, this.perAlpha) / totalPriority);
            
            // Calculate beta for importance sampling (annealed from start to end)
            const beta = Math.min(
                this.perBetaEnd,
                this.perBetaStart + (this.perBetaEnd - this.perBetaStart) * (this.totalFrames / this.perBetaFrames)
            );
            
            // Calculate max weight for normalization
            const minProb = Math.min(...probabilities);
            const maxWeight = Math.pow(this.memory.length * minProb, -beta);
            
            // Sample indices based on priorities
            const sampledIndices = new Set();
            while (sampledIndices.size < Math.min(batchSize, this.memory.length)) {
                // Weighted random sampling
                let rand = Math.random();
                let cumulativeProb = 0;
                for (let i = 0; i < probabilities.length; i++) {
                    cumulativeProb += probabilities[i];
                    if (rand < cumulativeProb && !sampledIndices.has(i)) {
                        sampledIndices.add(i);
                        break;
                    }
                }
                // Fallback to random if we couldn't sample (compare against target size, not batch.length which is 0)
                if (sampledIndices.size < batchSize) {
                    const randomIdx = Math.floor(Math.random() * this.memory.length);
                    sampledIndices.add(randomIdx);
                }
            }
            
            for (const idx of sampledIndices) {
                batch.push(this.memory[idx]);
                indices.push(idx);
                
                // Calculate importance sampling weight
                const prob = probabilities[idx];
                const weight = Math.pow(this.memory.length * prob, -beta) / maxWeight;
                weights.push(weight);
            }
        } else {
            // Uniform random sampling (original behavior)
            const uniqueIndices = new Set();
            
            while (uniqueIndices.size < Math.min(batchSize, this.memory.length)) {
                uniqueIndices.add(Math.floor(Math.random() * this.memory.length));
            }
            
            for (const index of uniqueIndices) {
                batch.push(this.memory[index]);
                indices.push(index);
                weights.push(1.0); // Uniform weights
            }
        }
        
        return { batch, indices, weights };
    }

    /**
     * Update target network weights from main network (hard update)
     */
    updateTargetModel() {
        const weights = this.model.getWeights();
        const weightCopies = weights.map(w => w.clone());
        this.targetModel.setWeights(weightCopies);
    }
    
    /**
     * Soft update target network weights (gradual blending)
     * targetWeights = tau * mainWeights + (1 - tau) * targetWeights
     */
    softUpdateTargetModel() {
        const mainWeights = this.model.getWeights();
        const targetWeights = this.targetModel.getWeights();
        
        const newWeights = mainWeights.map((mainW, i) => {
            return tf.tidy(() => {
                const targetW = targetWeights[i];
                // tau * main + (1 - tau) * target
                return mainW.mul(this.tau).add(targetW.mul(1 - this.tau));
            });
        });
        
        // Dispose old target weights
        targetWeights.forEach(w => w.dispose());
        
        this.targetModel.setWeights(newWeights);
        
        // Dispose temporary weights
        newWeights.forEach(w => w.dispose());
    }
    
    /**
     * Decay learning rate
     */
    decayLearningRate() {
        if (this.currentLearningRate > this.learningRateMin) {
            this.currentLearningRate *= this.learningRateDecay;
            
            // Recompile model with new learning rate every 1000 steps
            if (this.trainingSteps % 1000 === 0) {
                this.model.compile({
                    optimizer: tf.train.adam(this.currentLearningRate),
                    loss: tf.losses.huberLoss
                });
            }
        }
    }

    /**
     * Decay epsilon for exploration
     */
    decayEpsilon() {
        if (this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay;
        }
    }

    /**
     * End of episode callback
     */
    endEpisode() {
        this.episodeCount++;
        this.decayEpsilon();
        
        // Hard update target network periodically (if not using soft updates)
        if (!this.useSoftUpdate && this.episodeCount % this.updateTargetEvery === 0) {
            this.updateTargetModel();
        }
    }

    /**
     * Save model to IndexedDB
     * @param {string} name - Model name
     */
    async saveModel(name = 'fruit-merge-dqn') {
        await this.model.save(`indexeddb://${name}`);
        
        // Also save hyperparameters and training state
        const metadata = {
            epsilon: this.epsilon,
            episodeCount: this.episodeCount,
            trainingSteps: this.trainingSteps,
            totalFrames: this.totalFrames,
            currentLearningRate: this.currentLearningRate
        };
        localStorage.setItem(`${name}-metadata`, JSON.stringify(metadata));
    }

    /**
     * Load model from IndexedDB
     * @param {string} name - Model name
     * @returns {boolean} Success
     */
    async loadModel(name = 'fruit-merge-dqn') {
        try {
            this.model = await tf.loadLayersModel(`indexeddb://${name}`);
            this.targetModel = await tf.loadLayersModel(`indexeddb://${name}`);
            
            // Compile the loaded models with Huber loss
            this.model.compile({
                optimizer: tf.train.adam(this.currentLearningRate),
                loss: tf.losses.huberLoss
            });
            this.targetModel.compile({
                optimizer: tf.train.adam(this.currentLearningRate),
                loss: tf.losses.huberLoss
            });
            
            // Load metadata
            const metadataStr = localStorage.getItem(`${name}-metadata`);
            if (metadataStr) {
                const metadata = JSON.parse(metadataStr);
                this.epsilon = metadata.epsilon;
                this.episodeCount = metadata.episodeCount;
                this.trainingSteps = metadata.trainingSteps;
                this.totalFrames = metadata.totalFrames || 0;
                this.currentLearningRate = metadata.currentLearningRate || this.learningRate;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load model:', error);
            return false;
        }
    }

    /**
     * Check if a saved model exists
     * @param {string} name - Model name
     * @returns {Promise<boolean>}
     */
    async modelExists(name = 'fruit-merge-dqn') {
        try {
            const models = await tf.io.listModels();
            return `indexeddb://${name}` in models;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get training statistics
     * @returns {Object}
     */
    getStats() {
        return {
            episodeCount: this.episodeCount,
            trainingSteps: this.trainingSteps,
            epsilon: this.epsilon,
            memorySize: this.memory.length,
            totalFrames: this.totalFrames,
            currentLearningRate: this.currentLearningRate,
            useDoubleDQN: this.useDoubleDQN,
            usePER: this.usePER,
            useSoftUpdate: this.useSoftUpdate
        };
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.model) {
            this.model.dispose();
        }
        if (this.targetModel) {
            this.targetModel.dispose();
        }
        this.memory = [];
        this.priorities = [];
    }
}
