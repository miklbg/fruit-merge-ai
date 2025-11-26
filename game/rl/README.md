# Reinforcement Learning System

This directory contains the TensorFlow.js-based reinforcement learning system that enables AI agents to learn to play the Fruit Merge game.

## Architecture

### Modules

#### `game-api.js`
Provides a clean interface between the RL system and the game engine. Handles:
- Game state extraction (with caching for performance)
- Action execution (fruit dropping)
- Game reset functionality
- Fast-forward mode for training
- **Turbo mode** for maximum simulation speed

#### `game-environment.js`
Wraps the game as an RL environment with:
- **State representation**: 20-dimensional normalized vector
- **Action space**: 20 discrete drop positions
- **Reward function**: Encourages score, merges, and penalizes game over

#### `dqn-agent.js`
Deep Q-Network agent implementation with advanced optimizations:
- Neural network: 128→128→64→32→20 neurons (deeper network)
- **Double DQN**: Uses main network to select actions, target network to evaluate
- **Prioritized Experience Replay (PER)**: Samples important experiences more frequently
- **Soft target updates**: Gradual blending of target network weights
- **Learning rate scheduling**: Decays learning rate over time
- **Huber loss**: More robust to outliers than MSE
- Experience replay buffer (50,000 capacity)
- Model persistence via IndexedDB

#### `rl-controller.js`
High-level controller that:
- Manages training episodes
- Coordinates agent and environment
- Handles playback mode
- Provides statistics callbacks
- Tracks training speed (steps per second)

## Training Optimizations

### Algorithm Improvements

| Optimization | Description | Benefit |
|--------------|-------------|---------|
| **Double DQN** | Uses main network for action selection, target for evaluation | Reduces overestimation bias |
| **Prioritized Experience Replay** | Samples high TD-error experiences more frequently | Faster learning from important transitions |
| **Soft Target Updates** | Gradually blends target network weights (τ=0.005) | Smoother, more stable learning |
| **Learning Rate Decay** | Reduces LR from 0.0005 to 0.00001 over training | Better convergence |
| **Huber Loss** | Combines MSE and MAE | More robust to outliers |

### Simulation Speed Optimizations

| Optimization | Description | Speed Gain |
|--------------|-------------|------------|
| **Turbo Mode** | 50 physics updates per JS tick (vs 10 in normal fast-forward) | ~5x faster |
| **Reduced Cooldowns** | Drop cooldown: 8 steps (turbo) vs 15 (normal) vs 25 (original) | ~3x faster actions |
| **State Caching** | Caches game state within simulation step | Reduces redundant calculations |
| **Optimized Loops** | Direct array access instead of filter/forEach | ~20% faster state extraction |
| **queueMicrotask** | Uses faster scheduling than setTimeout(0) | Tighter simulation loop |

## State Representation

The environment converts the game state into a 20-dimensional vector:

```javascript
[
  score / 10000,              // Normalized score (0-1)
  currentFruitLevel / 9,      // Current fruit (0-1)
  nextFruitLevel / 9,         // Next fruit (0-1)
  fruitCount / 20,            // Number of fruits (0-1)
  avgFruitY,                  // Average Y position (0-1)
  maxFruitY,                  // Highest fruit (0-1)
  ...fruitLevelCounts,        // 10 values: count per fruit type
  fillLevel,                  // Container fill (0-1)
  timeSinceLastDrop / 5000,   // Time penalty (0-1)
  boosterAvailable,           // Booster ready (0 or 1)
  warningActive               // Warning state (0 or 1)
]
```

## Action Space

20 discrete actions representing drop positions across the game width:
- Action 0: Drop at leftmost position
- Action 9: Drop at center
- Action 19: Drop at rightmost position

## Reward Function

```javascript
reward = -0.1                           // Base penalty (encourage efficiency)
       + scoreGained / 100              // Score increase
       + mergeCount * 2                 // Bonus for merges
       - (fillLevel - 0.8) * 10         // Penalty when container fills
       - 100 (if game over)             // Large penalty for losing
       + levelIncrease * 10             // Bonus for new fruit levels
```

## Training Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Episodes | 1000 | Number of training episodes |
| Max Steps | 500 | Maximum steps per episode |
| Batch Size | 64 | Training batch size (increased for stability) |
| Learning Rate | 0.0005 | Initial neural network learning rate |
| LR Decay | 0.9995 | Learning rate decay per training step |
| LR Min | 0.00001 | Minimum learning rate |
| Gamma (γ) | 0.99 | Discount factor for future rewards |
| Epsilon Start | 1.0 | Initial exploration rate |
| Epsilon Min | 0.05 | Minimum exploration rate (higher for continued exploration) |
| Epsilon Decay | 0.997 | Decay per episode (slower) |
| Memory Size | 50,000 | Experience replay buffer size |
| Target Update | Soft (τ=0.005) | Continuous soft updates |
| PER Alpha | 0.6 | Priority exponent |
| PER Beta | 0.4→1.0 | Importance sampling weight (annealed) |

## Usage Example

```javascript
import { GameAPI } from './rl/game-api.js';
import { RLController } from './rl/rl-controller.js';

// Initialize
const gameAPI = new GameAPI();
gameAPI.init(gameInstance);

const rlController = new RLController(gameAPI);

// Set up callbacks
rlController.onStatsUpdate = (stats) => {
  console.log(`Episode ${stats.currentEpisode}, Score: ${stats.currentScore}, Speed: ${stats.stepsPerSecond} steps/s`);
};

rlController.onEpisodeEnd = (info) => {
  console.log(`Episode ${info.episode}: Score ${info.score}, Steps/s: ${info.stepsPerSecond.toFixed(1)}`);
};

rlController.onTrainingComplete = (stats) => {
  console.log('Training complete!', stats);
};

// Enable turbo mode for maximum training speed
gameAPI.setFastForwardMode(true, { turbo: true });

// Start training
await rlController.startTraining(1000, 500);

// Watch trained agent play
gameAPI.setFastForwardMode(false);
await rlController.startPlayback();
```

### Configuring Simulation Speed

```javascript
// Customize speed parameters for your hardware
gameAPI.configureSpeed({
  simulationBatchSize: 30,      // Physics updates per tick (normal fast-forward)
  turboBatchSize: 100,          // Physics updates per tick (turbo mode)
  dropCooldownSteps: 10,        // Steps to wait after drop (normal)
  turboDropCooldownSteps: 5,    // Steps to wait after drop (turbo)
  resetCooldownSteps: 3,        // Steps to wait after reset (normal)
  turboResetCooldownSteps: 2    // Steps to wait after reset (turbo)
});
```

## Model Persistence

Models are automatically saved to IndexedDB:
- **Storage key**: `indexeddb://fruit-merge-dqn`
- **Metadata**: Stored in localStorage as JSON (includes epsilon, learning rate, frame count)
- **Auto-save**: Every 10 episodes during training
- **Format**: TensorFlow.js LayersModel

To manually manage models:

```javascript
// Save
await agent.saveModel('my-model-name');

// Load
await agent.loadModel('my-model-name');

// Check existence
const exists = await agent.modelExists('my-model-name');
```

## Performance Optimization

### Turbo Mode (NEW)
Maximum speed training with:
- **50 physics updates per JavaScript tick** (vs 20 in normal fast-forward, 10 original)
- **Larger physics time steps** (33ms vs 16.67ms) for 2x physics speed
- **Minimal cooldowns** (8 steps for drop, 3 for reset)
- **queueMicrotask scheduling** for tighter loops
- **State caching** to avoid redundant calculations

### Fast-Forward Mode
Standard accelerated training:
- Rendering disabled for performance
- UI updates disabled
- 20 physics updates per tick
- 15 step drop cooldown, 5 step reset cooldown

### Algorithm Optimizations
- **Double DQN**: Reduces Q-value overestimation
- **Prioritized Experience Replay**: Learns from important experiences more often
- **Soft target updates**: Smoother learning with τ=0.005
- **Learning rate scheduling**: Adapts LR over training
- **Huber loss**: Robust to outlier rewards
- **Training frequency**: Model trains every 2 steps (balanced speed/learning)
- **Stats updates**: UI updates every 50 steps (reduced overhead)

### Memory Management
- Experience replay buffer capped at 50,000
- Priority values managed alongside experiences
- TensorFlow tensors properly disposed with `tf.tidy()`
- Old models cleaned up when new ones are saved

### Overall Training Speed
With turbo mode, training is approximately **100-500x faster** than real-time gameplay:
- 50 physics updates per tick
- 2x physics time step
- Minimal cooldowns (8 steps)
- No rendering overhead
- Efficient batch processing with larger batches (64)
- Optimized state extraction with caching

## Future Enhancements

Potential improvements:
- **PPO/A3C**: Implement policy gradient algorithms for continuous action spaces
- **Curriculum Learning**: Start with easier scenarios (fewer fruits, lower stakes)
- **Multi-agent**: Train multiple agents in parallel using Web Workers
- **N-step Returns**: Use multi-step TD for better credit assignment
- **Noisy Networks**: Replace epsilon-greedy with learned exploration
- **Distributional RL**: Model full distribution of returns (C51, QR-DQN)
- **Visualization**: Show Q-values, state importance, etc.

## Debugging

Enable debug logging:

```javascript
// In dqn-agent.js, add logging
console.log('Q-values:', qValues.dataSync());
console.log('Loss:', loss);

// In game-environment.js
console.log('State:', state);
console.log('Reward:', reward);
```

Monitor training progress:
```javascript
rlController.onEpisodeEnd = (info) => {
  console.log(`Ep ${info.episode}: Score ${info.score}, ` +
              `Steps ${info.steps}, Reward ${info.reward.toFixed(2)}, ` +
              `Epsilon ${(info.epsilon * 100).toFixed(1)}%`);
};
```

## References

- [Deep Q-Learning Paper](https://www.nature.com/articles/nature14236)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [Reinforcement Learning: An Introduction](http://incompleteideas.net/book/the-book.html)
