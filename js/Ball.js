/**
 * Ball class representing the player-controlled ball
 */
class Ball {
    constructor(position, radius = 15) {
        this.position = position.copy(); // Vector2D
        this.velocity = new Vector2D(0, 0); // Vector2D
        this.radius = radius;
        this.color = '#3498db';
        this.trailColor = '#3498db40';
        this.isMoving = false;
        this.friction = 0.99; // Middle ground between 0.995 and 0.985
        this.minSpeed = 0.4; // Slightly lower than current 0.5
        
        // Trail effect
        this.trail = [];
        this.maxTrailLength = 15;
        
        // Visual effects
        this.glowIntensity = 0;
    }

    // Update ball physics and movement
    update() {
        if (this.isMoving) {
            // Update position
            this.position.add(this.velocity);
            
            // Apply friction (deceleration)
            this.velocity.multiply(this.friction);
            
            // Stop if velocity is too low
            if (this.velocity.magnitude() < this.minSpeed) {
                this.velocity.set(0, 0);
                this.isMoving = false;
            }
            
            // Add to trail
            this.trail.push(this.position.copy());
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
            
            // Update glow based on speed
            this.glowIntensity = Math.min(1, this.velocity.magnitude() / 10);
        } else {
            // Fade trail when not moving
            if (this.trail.length > 0) {
                this.trail.shift();
            }
            this.glowIntensity *= 0.95;
        }
    }

    // Draw the ball and its trail
    draw(ctx) {
        ctx.save();
        
        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.trailColor;
            ctx.lineWidth = this.radius;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = i / this.trail.length;
                ctx.globalAlpha = alpha * 0.3;
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        // Draw glow effect when moving
        if (this.glowIntensity > 0) {
            const gradient = ctx.createRadialGradient(
                this.position.x, this.position.y, 0,
                this.position.x, this.position.y, this.radius * 3
            );
            gradient.addColorStop(0, this.color + Math.floor(this.glowIntensity * 80).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, this.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw main ball
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw highlight
        ctx.fillStyle = '#ffffff60';
        ctx.beginPath();
        ctx.arc(
            this.position.x - this.radius * 0.3, 
            this.position.y - this.radius * 0.3, 
            this.radius * 0.4, 
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw velocity indicator when stationary
        if (!this.isMoving && this.glowIntensity < 0.1) {
            ctx.strokeStyle = '#ffffff80';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }

    // Launch the ball towards a target position
    launchTowards(target, speed = 8) {
        if (this.isMoving) return false; // Can't launch while already moving
        
        const direction = Vector2D.fromPoints(this.position, target).normalize();
        this.velocity = direction.multiply(speed);
        this.isMoving = true;
        this.trail = []; // Clear trail
        
        return true;
    }

    // Check if ball is currently moving
    getIsMoving() {
        return this.isMoving;
    }

    // Stop the ball immediately
    stop() {
        this.velocity.set(0, 0);
        this.isMoving = false;
        this.trail = [];
    }

    // Reset ball to a new position
    reset(position) {
        this.position = position.copy();
        this.velocity.set(0, 0);
        this.isMoving = false;
        this.trail = [];
        this.glowIntensity = 0;
    }

    // Check if ball is within canvas bounds
    isInBounds(canvasWidth, canvasHeight) {
        return this.position.x >= this.radius && 
               this.position.x <= canvasWidth - this.radius &&
               this.position.y >= this.radius && 
               this.position.y <= canvasHeight - this.radius;
    }

    // Handle boundary collision
    handleBoundaryCollision(canvasWidth, canvasHeight) {
        let collided = false;
        
        if (this.position.x <= this.radius) {
            this.position.x = this.radius;
            this.velocity.x = Math.abs(this.velocity.x) * 0.8;
            collided = true;
        } else if (this.position.x >= canvasWidth - this.radius) {
            this.position.x = canvasWidth - this.radius;
            this.velocity.x = -Math.abs(this.velocity.x) * 0.8;
            collided = true;
        }
        
        if (this.position.y <= this.radius) {
            this.position.y = this.radius;
            this.velocity.y = Math.abs(this.velocity.y) * 0.8;
            collided = true;
        } else if (this.position.y >= canvasHeight - this.radius) {
            this.position.y = canvasHeight - this.radius;
            this.velocity.y = -Math.abs(this.velocity.y) * 0.8;
            collided = true;
        }
        
        return collided;
    }

    // Handle collision with a line (bounce off it)
    handleLineCollision(line) {
        // Get the closest point on the line to the ball
        const closestPoint = line.getClosestPointTo(this.position);
        const distance = this.position.distanceTo(closestPoint);
        
        // Check if we're actually colliding
        if (distance <= this.radius) {
            // Calculate the collision normal (from closest point to ball center)
            const normal = Vector2D.fromPoints(closestPoint, this.position);
            
            // Ensure we have a valid normal
            if (normal.magnitude() > 0) {
                normal.normalize();
                
                // Move ball out of the line
                const penetration = this.radius - distance + 2;
                this.position.add(normal.copy().multiply(penetration));
                
                // Perfect reflection: v' = v - 2(v·n)n
                const dotProduct = this.velocity.dot(normal);
                const reflection = normal.copy().multiply(2 * dotProduct);
                this.velocity.subtract(reflection);
                
                // Apply slight energy loss
                this.velocity.multiply(0.9);
            }
            
            return true;
        }
        
        return false;
    }
}
