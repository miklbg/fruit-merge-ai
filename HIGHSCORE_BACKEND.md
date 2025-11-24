# Global Highscore Backend Setup

This document explains how to set up a backend service for the global highscore feature.

## Current Implementation

The game currently uses **localStorage** as a demo storage solution. This means highscores are stored locally in the browser and are not shared between users or devices.

## Production Setup Options

To enable truly global highscores, you need to set up a backend service. Here are several options:

### Option 1: JSONBin.io (Easiest - Free Tier Available)

1. Go to https://jsonbin.io and create a free account
2. Create a new bin with initial content: `[]`
3. Copy your bin ID and API key
4. Update `game/highscores.js`:
   - Replace `YOUR_BIN_ID` with your actual bin ID
   - Replace `YOUR_API_KEY` with your actual API key
   - Uncomment the production code blocks
   - Comment out the localStorage fallback code

Example configuration:
```javascript
const HIGHSCORE_API_URL = 'https://api.jsonbin.io/v3/b/6789abcdef123456';
const HIGHSCORE_API_KEY = '$2b$10$your_actual_api_key_here';
```

### Option 2: Firebase Realtime Database

1. Create a Firebase project at https://firebase.google.com
2. Enable Realtime Database
3. Set up security rules to allow read access and authenticated write access
4. Install Firebase SDK: `npm install firebase`
5. Update `game/highscores.js` to use Firebase SDK

Example Firebase setup:
```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
```

### Option 3: Supabase (PostgreSQL Backend)

1. Create account at https://supabase.com
2. Create a new project
3. Create a `highscores` table with columns: `id`, `name`, `score`, `created_at`
4. Set up Row Level Security (RLS) policies
5. Use Supabase JavaScript client

Example Supabase setup:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Fetch highscores
const { data } = await supabase
  .from('highscores')
  .select('*')
  .order('score', { ascending: false })
  .limit(10);
```

### Option 4: Custom Backend API

Create your own backend using:
- Node.js + Express
- Python + Flask/FastAPI
- PHP
- Any other server-side technology

Requirements:
- **GET** endpoint to fetch top 10 highscores
- **POST** endpoint to submit new highscore
- CORS enabled for your domain
- Optional: Rate limiting and input validation

Example API structure:
```
GET  /api/highscores        - Returns top 10 highscores
POST /api/highscores        - Submits new highscore
     Body: { name: string, score: number }
```

## Security Considerations

1. **Input Validation**: Always validate names (max length, no special characters)
2. **Score Validation**: Consider adding server-side validation to prevent cheating
3. **Rate Limiting**: Limit submissions per IP/user to prevent spam
4. **CORS**: Configure properly to allow only your domain
5. **Authentication**: Consider requiring authentication for submissions

## Updating the Code

Once you've chosen a backend option, update `game/highscores.js`:

1. Update the API endpoint URLs
2. Update the fetch/submit functions to use your backend
3. Test thoroughly before deploying

## Testing

Before going live:
1. Test with multiple browsers
2. Test submission with various scores
3. Test edge cases (empty names, very long names, etc.)
4. Test concurrent submissions
5. Verify the top 10 limit is enforced

## Deployment

After setting up your backend:
1. Update `game/highscores.js` with production credentials
2. Build and deploy your game
3. Test the live version
4. Monitor for any issues

## Current Demo Mode

The game works out of the box using localStorage for demonstration purposes. Each user will have their own local "global" leaderboard. To truly enable global highscores across all players, you must set up one of the backend options above.
