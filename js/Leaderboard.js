/**
 * Leaderboard class to manage high scores using localStorage
 */
class Leaderboard {
    constructor() {
        this.storageKey = 'taberinos-leaderboard';
        this.maxEntries = 10;
    }

    // Save a new score to the leaderboard
    saveScore(level, shotsUsed) {
        const scores = this.getScores();
        const newScore = {
            level: level,
            shotsUsed: shotsUsed,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        scores.push(newScore);
        
        // Sort by level (descending), then by shots used (ascending for same level)
        scores.sort((a, b) => {
            if (a.level !== b.level) {
                return b.level - a.level; // Higher level is better
            }
            return a.shotsUsed - b.shotsUsed; // Fewer shots is better for same level
        });

        // Keep only the top scores
        const topScores = scores.slice(0, this.maxEntries);
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(topScores));
            console.log(`💾 Score saved: Level ${level} with ${shotsUsed} shots used`);
            return true;
        } catch (error) {
            console.error('Failed to save score to localStorage:', error);
            return false;
        }
    }

    // Get all scores from localStorage
    getScores() {
        try {
            const scores = localStorage.getItem(this.storageKey);
            return scores ? JSON.parse(scores) : [];
        } catch (error) {
            console.error('Failed to load scores from localStorage:', error);
            return [];
        }
    }

    // Clear all scores
    clearScores() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Leaderboard cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear leaderboard:', error);
            return false;
        }
    }

    // Check if a score qualifies for the leaderboard
    isHighScore(level, shotsUsed) {
        const scores = this.getScores();
        
        if (scores.length < this.maxEntries) {
            return true; // Always qualify if leaderboard isn't full
        }

        // Check if this score is better than the worst score
        const worstScore = scores[scores.length - 1];
        
        // Better if higher level, or same level with fewer shots
        if (level > worstScore.level) {
            return true;
        } else if (level === worstScore.level && shotsUsed < worstScore.shotsUsed) {
            return true;
        }
        
        return false;
    }

    // Get the rank of a score (1-based)
    getScoreRank(level, shotsUsed) {
        const scores = this.getScores();
        
        let rank = 1;
        for (const score of scores) {
            if (level < score.level || (level === score.level && shotsUsed > score.shotsUsed)) {
                rank++;
            }
        }
        
        return rank;
    }

    // Render the leaderboard HTML
    renderLeaderboard() {
        const scores = this.getScores();
        const container = document.getElementById('leaderboardList');
        
        if (!container) {
            console.error('Leaderboard container not found');
            return;
        }

        if (scores.length === 0) {
            container.innerHTML = `
                <div class="empty-leaderboard">
                    <p>🎯 No scores yet!</p>
                    <p>Play the game and reach higher levels to see your scores here.</p>
                </div>
            `;
            return;
        }

        let html = '';
        scores.forEach((score, index) => {
            const rank = index + 1;
            const isTopScore = rank === 1;
            const shotEfficiency = score.level > 0 ? (score.shotsUsed / score.level).toFixed(1) : score.shotsUsed;
            
            html += `
                <div class="leaderboard-entry ${isTopScore ? 'top-score' : ''}">
                    <div class="leaderboard-rank">${this.getRankIcon(rank)}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-level">Level ${score.level}</div>
                        <div class="leaderboard-date">${score.date} • ${score.shotsUsed} shots • ${shotEfficiency} shots/level</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Get appropriate icon for rank
    getRankIcon(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    }
}

// Global leaderboard instance
const leaderboard = new Leaderboard();

// Global functions for HTML onclick handlers
function toggleLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        leaderboard.renderLeaderboard();
        modal.style.display = 'flex';
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    } else {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function clearLeaderboard() {
    if (confirm('Are you sure you want to clear all scores? This cannot be undone.')) {
        leaderboard.clearScores();
        leaderboard.renderLeaderboard();
    }
}

// Close modal when clicking outside of it
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('leaderboardModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                toggleLeaderboard();
            }
        });
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('leaderboardModal');
        if (modal && modal.style.display === 'flex') {
            toggleLeaderboard();
        }
    }
});
