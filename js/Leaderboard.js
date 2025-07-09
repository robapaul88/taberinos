/**
 * Leaderboard class to manage high scores using localStorage and Firebase
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBqE8sJ9YxKqP7vF4mN2wR5tL8cG1dH6jK",
    authDomain: "taberinos-game.firebaseapp.com",
    projectId: "taberinos-game",
    storageBucket: "taberinos-game.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

class Leaderboard {
    constructor() {
        this.storageKey = 'taberinos-leaderboard';
        this.playerNameKey = 'taberinos-player-name';
        this.maxEntries = 10;
        this.firebaseInitialized = false;
        this.db = null;
        this.currentTab = 'global';
        
        this.initFirebase();
    }

    // Initialize Firebase
    async initFirebase() {
        try {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.firebaseInitialized = true;
            console.log('🔥 Firebase initialized successfully');
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.firebaseInitialized = false;
        }
    }

    // Get player name from localStorage or prompt for it
    getPlayerName() {
        let playerName = localStorage.getItem(this.playerNameKey);
        if (!playerName) {
            playerName = prompt('Enter your player name for the global leaderboard:') || 'Anonymous';
            localStorage.setItem(this.playerNameKey, playerName);
        }
        return playerName;
    }

    // Save score locally
    saveLocalScore(level, shotsUsed) {
        const scores = this.getLocalScores();
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
            console.log(`💾 Local score saved: Level ${level} with ${shotsUsed} shots used`);
            return true;
        } catch (error) {
            console.error('Failed to save score to localStorage:', error);
            return false;
        }
    }

    // Save score to Firebase
    async saveGlobalScore(level, shotsUsed) {
        if (!this.firebaseInitialized) {
            console.log('🔥 Firebase not available, skipping global score save');
            return false;
        }

        try {
            const playerName = this.getPlayerName();
            const newScore = {
                playerName: playerName,
                level: level,
                shotsUsed: shotsUsed,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now()
            };

            await this.db.collection('leaderboard').add(newScore);
            console.log(`🌍 Global score saved: ${playerName} - Level ${level} with ${shotsUsed} shots`);
            return true;
        } catch (error) {
            console.error('Failed to save score to Firebase:', error);
            return false;
        }
    }

    // Save score to both local and global
    async saveScore(level, shotsUsed) {
        const localSuccess = this.saveLocalScore(level, shotsUsed);
        const globalSuccess = await this.saveGlobalScore(level, shotsUsed);
        return { local: localSuccess, global: globalSuccess };
    }

    // Get local scores from localStorage
    getLocalScores() {
        try {
            const scores = localStorage.getItem(this.storageKey);
            return scores ? JSON.parse(scores) : [];
        } catch (error) {
            console.error('Failed to load scores from localStorage:', error);
            return [];
        }
    }

    // Get global scores from Firebase
    async getGlobalScores() {
        if (!this.firebaseInitialized) {
            return [];
        }

        try {
            const snapshot = await this.db.collection('leaderboard')
                .orderBy('level', 'desc')
                .orderBy('shotsUsed', 'asc')
                .limit(this.maxEntries)
                .get();

            const scores = [];
            snapshot.forEach(doc => {
                scores.push({ id: doc.id, ...doc.data() });
            });

            return scores;
        } catch (error) {
            console.error('Failed to load scores from Firebase:', error);
            return [];
        }
    }

    // Clear local scores
    clearLocalScores() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Local leaderboard cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear local leaderboard:', error);
            return false;
        }
    }

    // Clear global scores (password protected)
    async clearGlobalScores(password) {
        const correctPassword = 'taberinos-admin-2025'; // Change this to your desired password
        
        if (password !== correctPassword) {
            return { success: false, error: 'Incorrect password' };
        }

        if (!this.firebaseInitialized) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            const snapshot = await this.db.collection('leaderboard').get();
            const batch = this.db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log('🌍🗑️ Global leaderboard cleared');
            return { success: true };
        } catch (error) {
            console.error('Failed to clear global leaderboard:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if a score qualifies for the local leaderboard
    isLocalHighScore(level, shotsUsed) {
        const scores = this.getLocalScores();
        
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

    // Check if a score qualifies for the global leaderboard
    async isGlobalHighScore(level, shotsUsed) {
        if (!this.firebaseInitialized) {
            return false;
        }

        try {
            const snapshot = await this.db.collection('leaderboard')
                .orderBy('level', 'desc')
                .orderBy('shotsUsed', 'asc')
                .limit(this.maxEntries)
                .get();

            if (snapshot.size < this.maxEntries) {
                return true; // Always qualify if leaderboard isn't full
            }

            const scores = snapshot.docs.map(doc => doc.data());
            const worstScore = scores[scores.length - 1];
            
            // Better if higher level, or same level with fewer shots
            if (level > worstScore.level) {
                return true;
            } else if (level === worstScore.level && shotsUsed < worstScore.shotsUsed) {
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to check global high score:', error);
            return false;
        }
    }

    // Check if a score is a high score (local or global)
    async isHighScore(level, shotsUsed) {
        const localHigh = this.isLocalHighScore(level, shotsUsed);
        const globalHigh = await this.isGlobalHighScore(level, shotsUsed);
        return localHigh || globalHigh;
    }

    // Render the leaderboard HTML for local scores
    renderLocalLeaderboard() {
        const scores = this.getLocalScores();
        const container = document.getElementById('localLeaderboardList');
        
        if (!container) {
            console.error('Local leaderboard container not found');
            return;
        }

        if (scores.length === 0) {
            container.innerHTML = `
                <div class="empty-leaderboard">
                    <p>🎯 No personal scores yet!</p>
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

    // Render the leaderboard HTML for global scores
    async renderGlobalLeaderboard() {
        const container = document.getElementById('globalLeaderboardList');
        
        if (!container) {
            console.error('Global leaderboard container not found');
            return;
        }

        if (!this.firebaseInitialized) {
            container.innerHTML = `
                <div class="error-message">
                    <p>🔥 Firebase not available</p>
                    <p>Global leaderboard requires internet connection.</p>
                </div>
            `;
            return;
        }

        try {
            container.innerHTML = '<div class="loading-message">🔄 Loading global scores...</div>';
            
            const scores = await this.getGlobalScores();

            if (scores.length === 0) {
                container.innerHTML = `
                    <div class="empty-leaderboard">
                        <p>🌍 No global scores yet!</p>
                        <p>Be the first to set a record!</p>
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
                            <div class="leaderboard-level">Level ${score.level} - ${score.playerName}</div>
                            <div class="leaderboard-date">${score.date} • ${score.shotsUsed} shots • ${shotEfficiency} shots/level</div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Failed to render global leaderboard:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p>❌ Failed to load global scores</p>
                    <p>Please check your internet connection.</p>
                </div>
            `;
        }
    }

    // Render the current active leaderboard
    async renderLeaderboard() {
        if (this.currentTab === 'global') {
            await this.renderGlobalLeaderboard();
        } else {
            this.renderLocalLeaderboard();
        }
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

// Tab switching function
function switchTab(tabName) {
    leaderboard.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Leaderboard').classList.add('active');
    
    // Render the appropriate leaderboard
    leaderboard.renderLeaderboard();
}

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
    if (confirm('Are you sure you want to clear your personal scores? This cannot be undone.')) {
        leaderboard.clearLocalScores();
        leaderboard.renderLocalLeaderboard();
    }
}

async function clearGlobalLeaderboard() {
    const password = prompt('Enter admin password to clear global leaderboard:');
    if (!password) return;
    
    const result = await leaderboard.clearGlobalScores(password);
    
    if (result.success) {
        alert('✅ Global leaderboard cleared successfully!');
        leaderboard.renderGlobalLeaderboard();
    } else {
        alert('❌ Failed to clear global leaderboard: ' + result.error);
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
