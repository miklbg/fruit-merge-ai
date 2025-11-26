# Reinforcement Learning System

This directory contains the TensorFlow.js-based reinforcement learning system that enables AI agents to learn to play the Fruit Merge game.

## Architecture

### Modules

#### `game-api.js`
Provides a clean interface between the RL system and the game engine. Handles:
- Game state extraction
- Action execution (fruit dropping)
- Game reset functionality
- Fast-forward mode for training

#### `game-environment.js`
Wraps the game as an RL environment with:
- **State representation**: 20-dimensional normalized vector
- **Action space**: 20 discrete drop positions
- **Reward function**: Encourages score, merges, and penalizes game over

#### `dqn-agent.js`
Deep Q-Network agent implementation with:
- Neural network: 64→64→32→20 neurons
- Experience replay buffer (10,000 capacity)
- Target network for stable training
- Epsilon-greedy exploration strategy
- Model persistence via IndexedDB

#### `rl-controller.js`
High-level controller that:
- Manages training episodes
- Coordinates agent and environment
- Handles playback mode
- Provides statistics callbacks

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
| Batch Size | 32 | Training batch size |
| Learning Rate | 0.001 | Neural network learning rate |
| Gamma (γ) | 0.95 | Discount factor for future rewards |
| Epsilon Start | 1.0 | Initial exploration rate |
| Epsilon Min | 0.01 | Minimum exploration rate |
| Epsilon Decay | 0.995 | Decay per episode |
| Memory Size | 10000 | Experience replay buffer size |
| Target Update | 10 episodes | How often to update target network |

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
  console.log(`Episode ${stats.currentEpisode}, Score: ${stats.currentScore}`);
};

rlController.onTrainingComplete = (stats) => {
  console.log('Training complete!', stats);
};

// Start training
await rlController.startTraining(1000, 500);

// Watch trained agent play
await rlController.startPlayback();
```

## Model Persistence

Models are automatically saved to IndexedDB:
- **Storage key**: `indexeddb://fruit-merge-dqn`
- **Metadata**: Stored in localStorage as JSON
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

### Fast-Forward Mode
During training, the game runs significantly faster:
- Physics speed increased by 10x using `engine.timing.timeScale`
- Rendering disabled for performance (no visual updates during training)
- UI updates disabled for performance
- Action execution: 400ms minimum (respects DROP_COOLDOWN_MS to prevent adding fruits faster than game allows)
- Game reset: 100ms vs 200ms (2x faster)

### Training Optimizations
- **Batch prediction**: All experiences in a batch are predicted together (32x faster than individual predictions)
- **Training frequency**: Model trains every 4 steps instead of every step (4x reduction in training calls)
- **Stats updates**: UI updates every 20 steps instead of 10 (2x reduction in UI overhead)

### Memory Management
- Experience replay buffer capped at 10,000
- TensorFlow tensors properly disposed with `tf.tidy()`
- Old models cleaned up when new ones are saved

## Future Enhancements

Potential improvements:
- **PPO/A3C**: Implement more advanced RL algorithms
- **Prioritized Experience Replay**: Sample important experiences more frequently
- **Curriculum Learning**: Start with easier scenarios
- **Multi-agent**: Train multiple agents in parallel
- **Hyperparameter tuning**: Optimize learning parameters
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
