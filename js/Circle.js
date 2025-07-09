/**
 * Circle class representing intersection points between lines
 * These circles cause the ball to bounce instead of breaking lines
 */
class Circle {
    constructor(position, radius = 8, isWhite = false, sourceLines = []) {
        this.position = position; // Vector2D
        this.radius = radius;
        this.isWhite = isWhite;
        this.color = isWhite ? '#ffffff' : '#e67e22';
        this.glowColor = isWhite ? '#f8f9fa' : '#f39c12';
        this.bounceEffect = 0; // For visual bounce effect
        this.hasGeneratedLine = false; // Track if this white circle has generated a line
        this.sourceLines = sourceLines; // Array of lines that created this intersection
    }

    // Draw the circle on the canvas
    draw(ctx) {
        ctx.save();
        
        // Check if any source lines are broken for visual feedback
        const brokenSourceLines = this.sourceLines.filter(line => line.isBroken()).length;
        const opacity = brokenSourceLines === 0 ? 1 : (brokenSourceLines === 1 ? 0.6 : 0.2);
        
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, this.radius * 2
        );
        gradient.addColorStop(0, this.glowColor + Math.floor(opacity * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.glowColor + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main circle with bounce effect and opacity
        ctx.globalAlpha = opacity;
        const currentRadius = this.radius + this.bounceEffect;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw border for white circles
        if (this.isWhite) {
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, currentRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw inner highlight
        ctx.fillStyle = this.isWhite ? '#ffffff80' : '#ffffff40';
        ctx.beginPath();
        ctx.arc(
            this.position.x - currentRadius * 0.3, 
            this.position.y - currentRadius * 0.3, 
            currentRadius * 0.4, 
            0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.restore();
        
        // Decay bounce effect
        this.bounceEffect *= 0.9;
    }

    // Check if a point (ball) is colliding with this circle
    isCollidingWith(point, ballRadius) {
        const distance = this.position.distanceTo(point);
        return distance <= (this.radius + ballRadius);
    }

    // Handle bounce collision with ball
    bounce(ball) {
        // Calculate collision normal
        const collisionNormal = Vector2D.fromPoints(this.position, ball.position).normalize();
        
        // Reflect velocity
        const dotProduct = ball.velocity.dot(collisionNormal);
        ball.velocity.subtract(collisionNormal.copy().multiply(2 * dotProduct));
        
        // Add some energy loss to make bounces feel natural
        ball.velocity.multiply(0.8);
        
        // Move ball outside of circle to prevent sticking
        const pushDistance = (this.radius + ball.radius) - this.position.distanceTo(ball.position) + 1;
        ball.position.add(collisionNormal.multiply(pushDistance));
        
        // Visual bounce effect
        this.bounceEffect = 4;
        
        return true;
    }

    // Update animation
    update() {
        // Decay bounce effect
        this.bounceEffect = Math.max(0, this.bounceEffect * 0.9);
    }

    // Check if this circle should be removed (all source lines are broken)
    shouldBeRemoved() {
        // Circle should be removed only if ALL its source lines are broken
        // This makes sense for endpoint circles - they exist as long as at least one line remains
        return this.sourceLines.length > 0 && this.sourceLines.every(line => line.isBroken());
    }
}
