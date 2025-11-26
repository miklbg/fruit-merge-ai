/**
 * Deep Q-Network (DQN) Agent for Reinforcement Learning
 * Uses TensorFlow.js to learn optimal fruit dropping strategy
 */

// TensorFlow.js is loaded globally via CDN
const tf = window.tf;

export class DQNAgent {
    constructor(stateSize, actionSize, config = {}) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;
        
        // Hyperparameters
        this.gamma = config.gamma || 0.95; // Discount factor
        this.epsilon = config.epsilon || 1.0; // Exploration rate
        this.epsilonMin = config.epsilonMin || 0.01;
        this.epsilonDecay = config.epsilonDecay || 0.995;
        this.learningRate = config.learningRate || 0.001;
        this.batchSize = config.batchSize || 32;
        this.updateTargetEvery = config.updateTargetEvery || 10; // Episodes
        
        // Experience replay buffer
        this.memory = [];
        this.memorySize = config.memorySize || 10000;
        
        // Training counters
        this.episodeCount = 0;
        this.trainingSteps = 0;
        
        // Create Q-network and target network
        this.model = this.buildModel();
        this.targetModel = this.buildModel();
        this.updateTargetModel();
    }

    /**
     * Build the neural network model
     * @returns {tf.LayersModel}
     */
    buildModel() {
        const model = tf.sequential();
        
        // Input layer
        model.add(tf.layers.dense({
            inputShape: [this.stateSize],
            units: 64,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));
        
        // Hidden layers
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
        
        model.compile({
            optimizer: tf.train.adam(this.learningRate),
            loss: 'meanSquaredError'
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
            return Math.floor(Math.random() * this.actionSize);
        }
        
        // Exploitation: use Q-network to select best action
        return tf.tidy(() => {
            const stateTensor = tf.tensor2d([state]);
            const qValues = this.model.predict(stateTensor);
            const action = qValues.argMax(-1).dataSync()[0];
            return action;
        });
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
     * Store experience in replay buffer
     * @param {Float32Array} state
     * @param {number} action
     * @param {number} reward
     * @param {Float32Array} nextState
     * @param {boolean} done
     */
    remember(state, action, reward, nextState, done) {
        this.memory.push({ state, action, reward, nextState, done });
        
        // Keep memory size limited
        if (this.memory.length > this.memorySize) {
            this.memory.shift();
        }
    }

    /**
     * Train the model using experience replay
     * @returns {Promise<number>} Loss value
     */
    async replay() {
        if (this.memory.length < this.batchSize) {
            return 0;
        }
        
        // Sample random batch from memory
        const batch = this.sampleBatch(this.batchSize);
        
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
        
        // Batch predict for better performance - predict all states at once
        const currentQValuesArray = tf.tidy(() => {
            const statesTensor = tf.tensor2d(states);
            const predictions = this.model.predict(statesTensor);
            return predictions.arraySync();
        });
        
        const nextQValuesArray = tf.tidy(() => {
            const nextStatesTensor = tf.tensor2d(nextStates);
            const predictions = this.targetModel.predict(nextStatesTensor);
            return predictions.arraySync();
        });
        
        // Calculate targets for all experiences
        const targets = [];
        for (let i = 0; i < batch.length; i++) {
            // Use slice() for better performance than spread operator
            const targetQValues = currentQValuesArray[i].slice();
            
            // Calculate target Q-value
            let target = rewards[i];
            if (!dones[i]) {
                target = rewards[i] + this.gamma * Math.max(...nextQValuesArray[i]);
            }
            
            // Update Q-value for the taken action
            targetQValues[actions[i]] = target;
            targets.push(targetQValues);
        }
        
        // Train the model
        const statesTensor = tf.tensor2d(states);
        const targetsTensor = tf.tensor2d(targets);
        
        try {
            const history = await this.model.fit(statesTensor, targetsTensor, {
                epochs: 1,
                verbose: 0
            });
            
            const loss = history.history.loss[0];
            
            this.trainingSteps++;
            
            return loss;
        } finally {
            // Clean up tensors
            statesTensor.dispose();
            targetsTensor.dispose();
        }
    }

    /**
     * Sample a random batch from memory
     * @param {number} batchSize
     * @returns {Array} Batch of experiences
     */
    sampleBatch(batchSize) {
        const batch = [];
        const indices = new Set();
        
        while (indices.size < Math.min(batchSize, this.memory.length)) {
            indices.add(Math.floor(Math.random() * this.memory.length));
        }
        
        for (const index of indices) {
            batch.push(this.memory[index]);
        }
        
        return batch;
    }

    /**
     * Update target network weights from main network
     */
    updateTargetModel() {
        const weights = this.model.getWeights();
        const weightCopies = weights.map(w => w.clone());
        this.targetModel.setWeights(weightCopies);
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
        
        // Update target network periodically
        if (this.episodeCount % this.updateTargetEvery === 0) {
            this.updateTargetModel();
        }
    }

    /**
     * Save model to IndexedDB
     * @param {string} name - Model name
     */
    async saveModel(name = 'fruit-merge-dqn') {
        await this.model.save(`indexeddb://${name}`);
        
        // Also save hyperparameters
        const metadata = {
            epsilon: this.epsilon,
            episodeCount: this.episodeCount,
            trainingSteps: this.trainingSteps
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
            
            // Compile the loaded models (required for training)
            this.model.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'meanSquaredError'
            });
            this.targetModel.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'meanSquaredError'
            });
            
            // Load metadata
            const metadataStr = localStorage.getItem(`${name}-metadata`);
            if (metadataStr) {
                const metadata = JSON.parse(metadataStr);
                this.epsilon = metadata.epsilon;
                this.episodeCount = metadata.episodeCount;
                this.trainingSteps = metadata.trainingSteps;
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
            memorySize: this.memory.length
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
    }
}
