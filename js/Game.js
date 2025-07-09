/**
 * Main Game class that manages the game state, levels, and gameplay
 */
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.level = 1;
        this.shotsRemaining = 6;
        this.maxShots = 6;
        this.gameOver = false;
        this.levelComplete = false;
        
        // Game objects
        this.ball = null;
        this.lines = [];
        this.circles = [];
        
        // Animation
        this.animationId = null;
        this.isRunning = false;
        
        // Input handling
        this.setupEventListeners();
        
        // Start the game
        this.startLevel();
        this.startGameLoop();
    }

    // Setup event listeners for player input
    setupEventListeners() {
        // Mouse click handler
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const target = new Vector2D(clickX, clickY);
            
            this.handleInput(target);
        });

        // Touch handler for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            const target = new Vector2D(touchX, touchY);
            
            this.handleInput(target);
        });
        
        // Visual feedback on hover (desktop only)
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameOver || this.ball.getIsMoving()) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Store mouse position for aim line
            this.mousePosition = new Vector2D(mouseX, mouseY);
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mousePosition = null;
        });

        // Prevent context menu on long press (mobile)
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    // Handle input from both mouse and touch
    handleInput(target) {
        // Handle different game states
        if (this.levelComplete) {
            // Tap to go to next level
            this.nextLevel();
            return;
        }
        
        if (this.gameOver) {
            // Tap to restart game
            this.restart();
            return;
        }
        
        // Normal gameplay - shoot ball
        if (this.ball.getIsMoving()) return;
        this.shootBall(target);
    }

    // Generate lines for the current level
    generateLevel() {
        this.lines = [];
        this.circles = [];
        
        const baseLines = 6 + (this.level - 1) * 3; // Start with 6, add 3 per level
        const margin = 50;
        
        // Generate network of connected lines
        // Start with some anchor points that will serve as connection nodes
        const anchorPoints = [];
        const numAnchors = Math.min(Math.floor(baseLines / 2), 8); // Reasonable number of connection points
        
        for (let i = 0; i < numAnchors; i++) {
            anchorPoints.push(new Vector2D(
                margin + Math.random() * (this.width - 2 * margin),
                margin + Math.random() * (this.height - 2 * margin)
            ));
        }
        
        // Generate lines, some connecting to anchor points, others standalone
        for (let i = 0; i < baseLines; i++) {
            let start, end;
            
            // 60% chance to connect to an anchor point for network structure
            if (Math.random() < 0.6 && anchorPoints.length > 0) {
                const useStartAnchor = Math.random() < 0.5;
                const anchorIndex = Math.floor(Math.random() * anchorPoints.length);
                
                if (useStartAnchor) {
                    start = anchorPoints[anchorIndex].copy();
                    // Generate end point
                    const length = 80 + Math.random() * 120;
                    const angle = Math.random() * Math.PI * 2;
                    end = new Vector2D(
                        start.x + Math.cos(angle) * length,
                        start.y + Math.sin(angle) * length
                    );
                } else {
                    end = anchorPoints[anchorIndex].copy();
                    // Generate start point
                    const length = 80 + Math.random() * 120;
                    const angle = Math.random() * Math.PI * 2;
                    start = new Vector2D(
                        end.x - Math.cos(angle) * length,
                        end.y - Math.sin(angle) * length
                    );
                }
            } else {
                // Generate completely random line
                start = new Vector2D(
                    margin + Math.random() * (this.width - 2 * margin),
                    margin + Math.random() * (this.height - 2 * margin)
                );
                
                const length = 80 + Math.random() * 120;
                const angle = Math.random() * Math.PI * 2;
                
                end = new Vector2D(
                    start.x + Math.cos(angle) * length,
                    start.y + Math.sin(angle) * length
                );
            }
            
            // Keep line within bounds
            if (end.x < margin) end.x = margin;
            if (end.x > this.width - margin) end.x = this.width - margin;
            if (end.y < margin) end.y = margin;
            if (end.y > this.height - margin) end.y = this.height - margin;
            
            if (start.x < margin) start.x = margin;
            if (start.x > this.width - margin) start.x = this.width - margin;
            if (start.y < margin) start.y = margin;
            if (start.y > this.height - margin) start.y = this.height - margin;
            
            this.lines.push(new Line(start, end));
        }
        
        // Find endpoint intersections and create circles
        this.createEndpointCircles();
    }

    // Create circles at line endpoints where multiple lines meet
    createEndpointCircles() {
        const tolerance = 5; // Distance tolerance for considering endpoints as "same location"
        const endpointGroups = new Map(); // Map to group endpoints by location
        
        // Collect all line endpoints
        const allEndpoints = [];
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            allEndpoints.push({ point: line.start, lineIndex: i, isStart: true });
            allEndpoints.push({ point: line.end, lineIndex: i, isStart: false });
        }
        
        // Group endpoints that are close to each other
        for (const endpoint of allEndpoints) {
            let foundGroup = false;
            
            // Check if this endpoint belongs to an existing group
            for (const [groupKey, group] of endpointGroups) {
                const groupCenter = group.center;
                if (endpoint.point.distanceTo(groupCenter) <= tolerance) {
                    // Add to existing group
                    group.endpoints.push(endpoint);
                    group.lines.add(endpoint.lineIndex);
                    
                    // Update group center (average of all points in group)
                    const totalPoints = group.endpoints.length;
                    group.center = new Vector2D(
                        (groupCenter.x * (totalPoints - 1) + endpoint.point.x) / totalPoints,
                        (groupCenter.y * (totalPoints - 1) + endpoint.point.y) / totalPoints
                    );
                    
                    foundGroup = true;
                    break;
                }
            }
            
            // If no existing group found, create a new one
            if (!foundGroup) {
                const groupKey = `${Math.round(endpoint.point.x)}_${Math.round(endpoint.point.y)}`;
                endpointGroups.set(groupKey, {
                    center: endpoint.point.copy(),
                    endpoints: [endpoint],
                    lines: new Set([endpoint.lineIndex])
                });
            }
        }
        
        // Create circles for groups with 2 or more lines
        for (const group of endpointGroups.values()) {
            if (group.lines.size >= 2) {
                // 50% chance of being white (line-generating)
                const isWhite = Math.random() < 0.5;
                
                // Get the actual line objects that meet at this point
                const sourceLines = Array.from(group.lines).map(index => this.lines[index]);
                
                // Create circle at the average position
                this.circles.push(new Circle(group.center, 8, isWhite, sourceLines));
                
                console.log(`Created circle at (${Math.round(group.center.x)}, ${Math.round(group.center.y)}) connecting ${group.lines.size} lines`);
            }
        }
        
        console.log(`Generated ${this.circles.length} circles from ${endpointGroups.size} endpoint groups`);
    }

    // Place ball at random position
    placeBall() {
        let position;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            position = new Vector2D(
                50 + Math.random() * (this.width - 100),
                50 + Math.random() * (this.height - 100)
            );
            attempts++;
        } while (this.isPositionTooCloseToObjects(position, 30) && attempts < maxAttempts);
        
        if (this.ball) {
            this.ball.reset(position);
        } else {
            this.ball = new Ball(position);
        }
    }

    // Check if position is too close to lines or circles
    isPositionTooCloseToObjects(position, minDistance) {
        // Check distance to lines
        for (const line of this.lines) {
            const lineVec = Vector2D.fromPoints(line.start, line.end);
            const pointVec = Vector2D.fromPoints(line.start, position);
            const lineLength = lineVec.magnitude();
            
            if (lineLength > 0) {
                const projection = Math.max(0, Math.min(1, pointVec.dot(lineVec) / (lineLength * lineLength)));
                const closestPoint = line.start.copy().add(lineVec.copy().multiply(projection));
                
                if (position.distanceTo(closestPoint) < minDistance) {
                    return true;
                }
            }
        }
        
        // Check distance to circles
        for (const circle of this.circles) {
            if (position.distanceTo(circle.position) < minDistance + circle.radius) {
                return true;
            }
        }
        
        return false;
    }

    // Shoot the ball towards target
    shootBall(target) {
        if (this.shotsRemaining <= 0 || this.ball.getIsMoving()) return;
        
        const success = this.ball.launchTowards(target, 8);
        if (success) {
            this.shotsRemaining--;
            this.updateUI();
        }
    }

    // Main game loop
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    // Update game logic
    update() {
        if (this.gameOver) return;
        
        // Update ball
        this.ball.update();
        
        // Handle boundary collisions
        this.ball.handleBoundaryCollision(this.width, this.height);
        
        // Check collisions with circles (bounce)
        for (const circle of this.circles) {
            circle.update();
            if (circle.isCollidingWith(this.ball.position, this.ball.radius)) {
                circle.bounce(this.ball);
                
                // Generate new line if this is a white circle
                if (circle.isWhite && !circle.hasGeneratedLine) {
                    this.generateLineFromWhiteCircle(circle);
                    this.updateUI(); // Update line count display
                }
            }
        }
        
        // Check collisions with lines (bounce)
        let lineCollisionOccurred = false;
        for (const line of this.lines) {
            if (!line.isBroken() && !lineCollisionOccurred && line.intersectsWithPoint(this.ball.position, this.ball.radius)) {
                this.ball.handleLineCollision(line);
                line.break(); // Line still breaks when hit
                lineCollisionOccurred = true; // Prevent multiple line collisions in same frame
                this.updateUI(); // Update UI immediately when line is broken
            }
        }
        
        // Remove circles whose source lines are both broken
        this.circles = this.circles.filter(circle => !circle.shouldBeRemoved());
        
        // Check win/lose conditions
        if (!this.ball.getIsMoving()) {
            this.checkGameState();
        }
    }

    // Check if level is complete or game is over
    checkGameState() {
        const unbrokenLines = this.lines.filter(line => !line.isBroken()).length;
        
        if (unbrokenLines === 0) {
            // Level complete!
            this.levelComplete = true;
            this.updateUI();
        } else if (this.shotsRemaining <= 0) {
            // Game over
            this.gameOver = true;
            this.updateUI();
        }
    }

    // Draw everything
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw aim line when not moving
        if (!this.ball.getIsMoving() && this.mousePosition && !this.gameOver) {
            this.drawAimLine();
        }
        
        // Draw lines
        for (const line of this.lines) {
            line.draw(this.ctx);
        }
        
        // Draw circles
        for (const circle of this.circles) {
            circle.draw(this.ctx);
        }
        
        // Draw ball
        this.ball.draw(this.ctx);
        
        // Draw game over/level complete messages
        if (this.gameOver) {
            this.drawGameOver();
        } else if (this.levelComplete) {
            this.drawLevelComplete();
        }
    }

    // Draw aim line from ball to mouse
    drawAimLine() {
        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff80';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.ball.position.x, this.ball.position.y);
        this.ctx.lineTo(this.mousePosition.x, this.mousePosition.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    // Draw game over message
    drawGameOver() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.width / 2, this.height / 2 - 40);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`You reached level ${this.level}`, this.width / 2, this.height / 2 + 10);
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Tap anywhere to restart', this.width / 2, this.height / 2 + 40);
        
        this.ctx.restore();
    }

    // Draw level complete message
    drawLevelComplete() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#27ae60';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Level Complete!', this.width / 2, this.height / 2 - 40);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Tap anywhere to continue', this.width / 2, this.height / 2 + 10);
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Level ${this.level + 1} coming up...`, this.width / 2, this.height / 2 + 40);
        
        this.ctx.restore();
    }

    // Start a new level
    startLevel() {
        this.generateLevel();
        this.placeBall();
        this.maxShots = 6 + (this.level - 1); // Start with 6 shots, add 1 per level
        this.shotsRemaining = this.maxShots;
        this.gameOver = false;
        this.levelComplete = false;
        this.updateUI();
    }

    // Go to next level
    nextLevel() {
        if (!this.levelComplete) return;
        
        this.level++;
        this.startLevel();
    }

    // Restart the game
    restart() {
        this.level = 1;
        this.startLevel();
    }

    // Update UI elements
    updateUI() {
        const unbrokenLines = this.lines.filter(line => !line.isBroken()).length;
        const totalLines = this.lines.length;
        const brokenLines = this.lines.filter(line => line.isBroken()).length;
        
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('shotsDisplay').textContent = this.shotsRemaining;
        document.getElementById('linesDisplay').textContent = unbrokenLines;
        
        const nextBtn = document.getElementById('nextLevelBtn');
        nextBtn.disabled = !this.levelComplete;
    }

    // Start the game loop
    startGameLoop() {
        this.isRunning = true;
        this.gameLoop();
    }

    // Stop the game loop
    stopGameLoop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    // Generate a new line from a white circle to another random white circle
    generateLineFromWhiteCircle(sourceCircle) {
        if (!sourceCircle.isWhite || sourceCircle.hasGeneratedLine) return false;
        
        // Find all other white circles that haven't generated lines
        const availableWhiteCircles = this.circles.filter(circle => 
            circle.isWhite && 
            circle !== sourceCircle && 
            !circle.hasGeneratedLine &&
            circle.position.distanceTo(sourceCircle.position) > 50 // Minimum distance
        );
        
        if (availableWhiteCircles.length === 0) return false;
        
        // Pick a random target circle
        const targetCircle = availableWhiteCircles[Math.floor(Math.random() * availableWhiteCircles.length)];
        
        // Create new line between the circles
        const newLine = new Line(sourceCircle.position.copy(), targetCircle.position.copy());
        newLine.color = '#9b59b6'; // Purple color for generated lines
        newLine.isGenerated = true;
        this.lines.push(newLine);
        
        // Debug info
        console.log(`Generated new line! Total lines now: ${this.lines.length}`);
        
        // Mark both circles as having generated lines
        sourceCircle.hasGeneratedLine = true;
        targetCircle.hasGeneratedLine = true;
        
        return true;
    }

    // Handle canvas resize
    handleResize(newWidth, newHeight) {
        const oldWidth = this.width;
        const oldHeight = this.height;
        
        this.width = newWidth;
        this.height = newHeight;
        
        // Scale existing game objects to new dimensions
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        
        // Scale ball position
        if (this.ball) {
            this.ball.position.x *= scaleX;
            this.ball.position.y *= scaleY;
        }
        
        // Scale lines
        for (const line of this.lines) {
            line.start.x *= scaleX;
            line.start.y *= scaleY;
            line.end.x *= scaleX;
            line.end.y *= scaleY;
        }
        
        // Scale circles
        for (const circle of this.circles) {
            circle.position.x *= scaleX;
            circle.position.y *= scaleY;
        }
        
        console.log(`🎮 Game objects scaled from ${oldWidth}x${oldHeight} to ${newWidth}x${newHeight}`);
    }
}
