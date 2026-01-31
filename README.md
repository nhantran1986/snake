# 🐍 NEON SNAKE

A premium, high-performance web-based Snake game with a sleek neon aesthetic. Designed for seamless gameplay with full state persistence and deep customizability.

## ✨ Features

- **Premium Neon Aesthetic**: Vibrant glowing visuals with cyan snakes and magenta cores.
- **Dynamic Board Sizes**: Choose between **Easy** (Small), **Medium** (Standard), and **Hard** (Large) grid dimensions.
- **Variable Speed Intensity**: 5 distinct speed levels that can be adjusted mid-game.
- **Full State Persistence**: Automatically saves your score, high score, best time, custom keys, and current game state. Refresh the page and pick up exactly where you left off.
- **Auto-Pause Fail-safe**: Forced pause on refresh to prevent accidental deaths.
- **Deep Customization**: Remap every single control including movement, pause, reboot, and speed level shortcuts.
- **Survival Timer**: Tracks your current run duration and records your **Best Time** (longest survival).

## 🎮 How to Play

1. **Objective**: Maneuver the serpent to consume light cores. Each core lengthens the snake and increases your score.
2. **Controls (Default)**:
   - **Movement**: Arrow Keys (Up, Down, Left, Right)
   - **Pause**: `P` or `Esc`
   - **Reboot**: `R` (Requires confirmation during active runs)
   - **Speed Shortcuts**: `1` through `5`
3. **Confirmation System**:
   - **Confirm Reboot/Mode Switch**: `Enter` or `Y`
   - **Abort Reboot/Mode Switch**: `Esc` or `N`

## 🛠️ Technical Implementation

- **Language**: Pure JavaScript (ES6+), HTML5, CSS3.
- **Graphics**: High-performance rendering using the HTML5 **Canvas API**.
- **Persistence**: robust state management using the **LocalStorage API**.
- **Design**: Modern "Glassmorphism" UI with CSS variables for unified theme management.

## 🚀 Local Setup

1. Clone or download the repository.
2. Open `index.html` in any modern web browser.
3. No build steps or dependencies required.

---
*Transcend the grid. Become the Serpent.*
