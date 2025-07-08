<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Taberinos - Line Breaking Ball Game

## Project Overview
This is a browser-based physics puzzle game built with HTML5 Canvas and vanilla JavaScript. The game features a ball that breaks lines it hits and bounces off intersection circles.

## Code Style Guidelines
- Use ES6+ features and modern JavaScript
- Follow object-oriented programming patterns
- Use descriptive variable and function names
- Include JSDoc comments for classes and complex functions
- Maintain consistent indentation (4 spaces)

## Game Architecture
- **Vector2D**: Utility class for 2D math operations
- **Ball**: Player-controlled ball with physics
- **Line**: Breakable line segments in the game area
- **Circle**: Intersection points that cause ball bouncing
- **Game**: Main game controller managing state and logic

## Physics and Game Logic
- Ball movement uses velocity vectors with friction/deceleration
- Collision detection uses distance calculations and vector math
- Lines break when ball intersects with them AND ball bounces off them
- Circles reflect ball velocity using collision normals
- White circles (50% of circles) generate new purple lines when hit
- Progressive difficulty: fewer shots and more lines per level (doubled from original)
- Tap-to-continue: tap screen to advance levels or restart game

## Visual Design
- Modern, clean aesthetic with gradients and glows
- Smooth animations and visual feedback
- Responsive particle effects and trails
- Color scheme: blues for ball, oranges/white for circles, dark grays/purples for lines
- Larger ball radius (15px) for better visibility and collision feel

## Performance Considerations
- Use requestAnimationFrame for smooth 60fps gameplay
- Minimize canvas redraw operations
- Efficient collision detection algorithms
- Clean up unused objects and trails

## Development Patterns
- Modular file structure with clear separation of concerns
- Event-driven input handling
- State management through the main Game class
- Debug utilities for development testing
