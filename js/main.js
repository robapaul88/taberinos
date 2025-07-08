/**
 * Main entry point for the Taberinos game
 */

// Global game instance
let game;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Starting Taberinos - Line Breaking Ball Game');
    
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Ensure canvas context is available
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas 2D context not available!');
        return;
    }
    
    // Initialize the game
    try {
        game = new Game(canvas);
        console.log('✅ Game initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    // Optional: Add responsive canvas resizing here if needed
});

// Handle visibility change (pause/resume game when tab changes)
document.addEventListener('visibilitychange', function() {
    if (game) {
        if (document.hidden) {
            // Pause game when tab is hidden
            console.log('🔄 Game paused');
        } else {
            // Resume game when tab is visible
            console.log('▶️ Game resumed');
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (!game) return;
    
    switch(e.key) {
        case 'r':
        case 'R':
            // Restart game
            game.restart();
            break;
        case 'n':
        case 'N':
            // Next level (if available)
            if (!document.getElementById('nextLevelBtn').disabled) {
                game.nextLevel();
            }
            break;
        case 'Escape':
            // Stop ball movement
            if (game.ball && game.ball.getIsMoving()) {
                game.ball.stop();
            }
            break;
    }
});

// Add some helpful console commands for development/debugging
window.gameDebug = {
    // Skip to next level
    nextLevel: () => {
        if (game) {
            game.level++;
            game.startLevel();
        }
    },
    
    // Add extra shots
    addShots: (count = 5) => {
        if (game) {
            game.shotsRemaining += count;
            game.updateUI();
        }
    },
    
    // Break all lines (win level)
    breakAllLines: () => {
        if (game) {
            game.lines.forEach(line => line.break());
        }
    },
    
    // Get game state
    getState: () => {
        if (game) {
            return {
                level: game.level,
                shots: game.shotsRemaining,
                lines: game.lines.length,
                brokenLines: game.lines.filter(line => line.isBroken()).length,
                circles: game.circles.length
            };
        }
    }
};

console.log('🛠️ Debug commands available: window.gameDebug');
console.log('⌨️ Keyboard shortcuts: R (restart), N (next level), ESC (stop ball)');
