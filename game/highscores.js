/**
 * Global Highscore Manager
 * Manages fetching and submitting global highscores
 */

// Configuration
const HIGHSCORE_API_URL = 'https://api.jsonbin.io/v3/b/69241d0443b1c97be9c19182';
const HIGHSCORE_API_KEY = '$2a$10$K5pKfYyHPXIHaPSCmT0GZuga6ywRs61QDtSudYPYYWYlSMScYMUDi';

// Maximum number of highscores to keep
const MAX_HIGHSCORES = 10;

/**
 * Fetch global highscores from the backend
 * @returns {Promise<Array>} Array of highscore objects
 */
export async function fetchGlobalHighscores() {
    try {
        const response = await fetch(HIGHSCORE_API_URL + '/latest', {
            method: 'GET',
            headers: {
                'X-Master-Key': HIGHSCORE_API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch highscores');
        }
        
        const data = await response.json();
        return data.record || [];
    } catch (error) {
        console.error('Error fetching highscores:', error);
        // Fallback to localStorage if API fails
        const localScores = localStorage.getItem('global-highscores');
        if (localScores) {
            return JSON.parse(localScores);
        }
        return [];
    }
}

/**
 * Submit a new highscore
 * @param {string} name - Player name
 * @param {number} score - Player score
 * @returns {Promise<boolean>} True if submission was successful
 */
export async function submitHighscore(name, score) {
    // Helper function to process and save highscores
    async function saveToLocalStorage(highscores, name, score) {
        highscores.push({
            name: name.trim(),
            score: score,
            date: new Date().toISOString()
        });
        highscores.sort((a, b) => b.score - a.score);
        const topScores = highscores.slice(0, MAX_HIGHSCORES);
        localStorage.setItem('global-highscores', JSON.stringify(topScores));
        return topScores;
    }
    
    try {
        // Fetch current highscores
        const highscores = await fetchGlobalHighscores();
        
        // Add new score
        highscores.push({
            name: name.trim(),
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort by score (descending)
        highscores.sort((a, b) => b.score - a.score);
        
        // Keep only top MAX_HIGHSCORES
        const topScores = highscores.slice(0, MAX_HIGHSCORES);
        
        // Save to JSONBin
        const response = await fetch(HIGHSCORE_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': HIGHSCORE_API_KEY
            },
            body: JSON.stringify(topScores)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit highscore');
        }
        
        // Also save to localStorage as backup
        localStorage.setItem('global-highscores', JSON.stringify(topScores));
        
        return true;
    } catch (error) {
        console.error('Error submitting highscore:', error);
        // Fallback to localStorage only if API fails
        try {
            const highscores = await fetchGlobalHighscores();
            await saveToLocalStorage(highscores, name, score);
            return true;
        } catch (fallbackError) {
            console.error('Error in fallback submission:', fallbackError);
            return false;
        }
    }
}

/**
 * Check if a score qualifies for the top 10
 * @param {number} score - Score to check
 * @returns {Promise<boolean>} True if score qualifies for top 10
 */
export async function qualifiesForTop10(score) {
    try {
        const highscores = await fetchGlobalHighscores();
        
        // If we have less than MAX_HIGHSCORES, any score qualifies
        if (highscores.length < MAX_HIGHSCORES) {
            return true;
        }
        
        // Check if score is higher than the lowest top 10 score
        const lowestTopScore = highscores[highscores.length - 1].score;
        return score > lowestTopScore;
    } catch (error) {
        console.error('Error checking top 10 qualification:', error);
        return false;
    }
}

/**
 * Get the player's rank for a given score
 * @param {number} score - Score to rank
 * @returns {Promise<number>} Rank (1-based), or 0 if not in top 10
 */
export async function getScoreRank(score) {
    try {
        const highscores = await fetchGlobalHighscores();
        
        // Add the score temporarily to find its rank
        const testScores = [...highscores, { score: score }];
        testScores.sort((a, b) => b.score - a.score);
        
        // Find the rank (1-based)
        const rank = testScores.findIndex(s => s.score === score) + 1;
        
        // Return rank only if it's in top 10
        return rank <= MAX_HIGHSCORES ? rank : 0;
    } catch (error) {
        console.error('Error getting score rank:', error);
        return 0;
    }
}
