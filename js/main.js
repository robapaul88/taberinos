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
    
    // Set up responsive canvas sizing
    setupResponsiveCanvas(canvas);
    
    // Initialize the game
    try {
        game = new Game(canvas);
        console.log('✅ Game initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
    }
});

// Setup responsive canvas sizing
function setupResponsiveCanvas(canvas) {
    const container = canvas.parentElement;
    
    function resizeCanvas() {
        // Get viewport dimensions (available browser space)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth <= 768;
        
        let canvasWidth, canvasHeight;
        
        if (isMobile) {
            // On mobile, use most of the viewport width but leave space for UI
            const containerWidth = container.clientWidth - 20; // Account for padding
            canvasWidth = Math.min(containerWidth, viewportWidth * 0.95);
            canvasHeight = Math.min(canvasWidth * 0.75, viewportHeight * 0.5); // Leave space for UI elements
        } else {
            // On desktop, use a reasonable portion of the viewport
            const maxWidth = Math.min(viewportWidth * 0.6, 700); // Smaller max width for desktop
            const maxHeight = Math.min(viewportHeight * 0.6, 500); // Reasonable height
            
            // Maintain aspect ratio (4:3)
            const aspectRatio = 4 / 3;
            if (maxWidth / maxHeight > aspectRatio) {
                canvasWidth = maxHeight * aspectRatio;
                canvasHeight = maxHeight;
            } else {
                canvasWidth = maxWidth;
                canvasHeight = maxWidth / aspectRatio;
            }
        }
        
        // Ensure minimum size for playability
        if (canvasWidth < 320) {
            canvasWidth = 320;
            canvasHeight = 240;
        }
        
        // Set canvas size
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Update CSS size to match
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
        
        console.log(`📐 Canvas resized to ${canvasWidth}x${canvasHeight} (Viewport: ${viewportWidth}x${viewportHeight}, Mobile: ${isMobile})`);
        
        // Restart the game if it exists to adjust to new dimensions
        if (game) {
            game.handleResize(canvasWidth, canvasHeight);
        }
    }
    
    // Initial resize
    resizeCanvas();
    
    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Listen for orientation change on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100); // Small delay to ensure orientation change is complete
    });
}

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
    },
    
    // Leaderboard debug commands
    leaderboard: {
        // Add test scores
        addTestScores: () => {
            leaderboard.saveScore(15, 85);
            leaderboard.saveScore(12, 72);
            leaderboard.saveScore(8, 48);
            leaderboard.saveScore(10, 65);
            leaderboard.saveScore(5, 30);
            console.log('✅ Test scores added to leaderboard');
        },
        
        // View leaderboard data
        view: () => {
            console.table(leaderboard.getScores());
        },
        
        // Clear leaderboard
        clear: () => {
            leaderboard.clearScores();
            console.log('🗑️ Leaderboard cleared');
        }
    }
};

console.log('🛠️ Debug commands available: window.gameDebug');
console.log('🏆 Leaderboard debug: window.gameDebug.leaderboard');
console.log('⌨️ Keyboard shortcuts: R (restart), N (next level), ESC (stop ball)');
