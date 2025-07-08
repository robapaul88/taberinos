# 🎯 Taberinos - Line Breaking Ball Game

A captivating browser-based physics puzzle game where you control a ball to break lines while navigating around bouncing circles.

## 🎮 How to Play

1. **Objective**: Break all the lines in each level by hitting them with the ball
2. **Controls**: Click anywhere on the game area to launch the ball toward that position
3. **Physics**: The ball moves with initial speed and gradually decelerates to a stop
4. **Obstacles**: Orange circles at line intersections will bounce the ball but won't break
5. **Challenge**: Each level has fewer shots available and more lines to break

## 🚀 Getting Started

Simply open `index.html` in any modern web browser. No build process or dependencies required!

```bash
# Clone or download the project
# Open index.html in your browser
# Start playing!
```

## 🎯 Game Features

- **Physics-Based Movement**: Realistic ball physics with deceleration
- **Visual Effects**: Smooth trails, glowing effects, and particle animations
- **Progressive Difficulty**: Each level increases challenge with more lines and fewer shots
- **Responsive Design**: Clean, modern UI that works on different screen sizes
- **Interactive Feedback**: Visual aim line and hover effects

## 🏗️ Project Structure

```
Taberinos/
├── index.html          # Main game page
├── js/
│   ├── Vector2D.js     # 2D vector math utilities
│   ├── Ball.js         # Ball physics and rendering
│   ├── Line.js         # Line objects that can be broken
│   ├── Circle.js       # Bouncing circle obstacles
│   ├── Game.js         # Main game logic and state management
│   └── main.js         # Game initialization and controls
├── .github/
│   └── copilot-instructions.md
└── README.md
```

## 🛠️ Technical Details

- **Technology**: HTML5 Canvas, Vanilla JavaScript (ES6+)
- **Rendering**: 60fps game loop with requestAnimationFrame
- **Physics**: Custom 2D vector math and collision detection
- **Architecture**: Object-oriented design with modular components

## 🎮 Controls & Shortcuts

- **Mouse Click**: Launch ball toward clicked position
- **R Key**: Restart current game
- **N Key**: Next level (when available)
- **ESC Key**: Stop ball movement immediately

## 🐛 Debug Console

Open browser developer tools and use `window.gameDebug` for testing:

```javascript
// Skip to next level
gameDebug.nextLevel()

// Add extra shots
gameDebug.addShots(5)

// Win current level instantly
gameDebug.breakAllLines()

// Check current game state
gameDebug.getState()
```

## 🎨 Game Mechanics

### Ball Physics
- Initial velocity toward clicked target
- Continuous deceleration (friction)
- Boundary collision with energy loss
- Trail effects based on movement speed

### Line Breaking
- Lines disappear when hit by the ball
- Collision detection using point-to-line distance
- Visual feedback with color changes

### Circle Bouncing
- Elastic collision with velocity reflection
- Energy loss for realistic physics
- Glowing visual effects on impact

### Level Progression
- **Level 1**: 5 shots, 4 lines
- **Level 2**: 5 shots, 5 lines
- **Level N**: max(3, 7-N) shots, (3+N) lines

## 🎯 Future Enhancements

- Power-ups and special abilities
- Different ball types with unique properties
- Multiplayer mode
- Level editor
- Sound effects and music
- Mobile touch controls optimization

## 📱 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy breaking those lines!** 🎯
