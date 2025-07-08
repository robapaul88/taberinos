/**
 * 2D Vector utility class for position, velocity, and mathematical operations
 */
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Create a copy of this vector
    copy() {
        return new Vector2D(this.x, this.y);
    }

    // Add another vector to this one
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    // Subtract another vector from this one
    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    // Multiply by a scalar
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    // Get the magnitude (length) of the vector
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    // Normalize the vector (make it unit length)
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    // Calculate distance to another vector
    distanceTo(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate dot product with another vector
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    // Set the vector values
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    // Static method to create a vector from two points
    static fromPoints(p1, p2) {
        return new Vector2D(p2.x - p1.x, p2.y - p1.y);
    }

    // Static method to create a unit vector in a given direction (radians)
    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }
}
