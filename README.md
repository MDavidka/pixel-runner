# 🎮 Pixel Runner (Valley Explorer)

A dynamic HTML5 Canvas / Phaser 3 pixel platformer runner game featuring procedural biomes, rich interactive story events, quick-time events (QTE), a responsive mobile HUD, anti-gravity parkour, mine exploration, train rooftops, and lunar missions.

---

## ✨ Features

- **Procedural Biomes & Zones**:
  - **Zone 5101**: Valley Surface Trail & Ancient Forest
  - **Zone 5102**: Caverns & Subterranean Mine with interactive generator & flashing light fixtures
  - **Zone 5103**: High Runic Anti-Gravity Levitating Blocks & Sky Islands
  - **Zone 5104**: Speeding Freight Train Rooftop Parkour
  - **Zone 5105**: Orbital Rocket Launchpad & Lunar Surface Base (`M` crater exploration)
- **Visuals & Atmosphere**:
  - Pure vector/canvas multi-stop atmospheric sky gradients (zero blurry raster backgrounds)
  - Parallax rolling mountain ridges and procedural pixel clouds
  - Chunky 3D beveled platforms and anti-gravity thruster glow
  - Procedural buildings (Kós Károly School, Kaufland Supermarket, Modern Bridges)
- **Interactive Gameplay**:
  - Character selection (Timi, Márta, Enci)
  - Dynamic stamina/energy management, sprinting, jumping, and climbing
  - Multi-choice valley encounter events and Quick Time Event (QTE) zone checkpoints
  - Ore mining, tree harvesting, campfire rest stops, and treasure chests
  - Full cabin homestead interior customization and inventory system
- **Accessibility & Controls**:
  - Full mobile on-screen touch D-Pad and action buttons with SVG vector icons
  - Desktop keyboard controls (`A`/`D`/Arrows, `Space`/`W`/`Up`, `Shift`/`J`, `E`, `I`, `Q`)
  - Adjustable accessibility settings (high contrast, zoom, audio toggle)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation

```bash
# Clone repository
git clone https://github.com/MDavidka/pixel-runner.git
cd pixel-runner

# Install dependencies
npm install

# Start server
npm start
```

The game will be available at `http://localhost:3000` (or configured port).

---

## 🛠 Tech Stack

- **Frontend**: HTML5 Canvas, Vanilla JS / TypeScript, CSS3, Vector SVG
- **Framework**: Phaser 3 / Custom Canvas Game Engine
- **Backend / Server**: Node.js HTTP server
- **Bundler**: esbuild

---

## 📜 License
MIT
