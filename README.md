# DeadLyze

<div align="center">

**Desktop companion application for Deadlock game**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/yourusername/deadlyze-app/releases)
[![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-green.svg)](LICENSE.md)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app)

</div>

## 📋 Overview

DeadLyze is a modern desktop application built with Tauri, React, and TypeScript for Deadlock players. Launch your game with style and track your statistics seamlessly.

## ✨ Features (v0.1.0)

### 🎮 Game Launcher

- **One-click Steam integration** — Launch Deadlock instantly through Steam
- **Real-time game detection** — Smart detection of running game processes
- **Animated UI** — Spinning top physics-based button interaction
- **Visual feedback** — Glitch effects and color transitions during launch cooldown

### ⚙️ Settings & Customization

- **Multi-language support** — English and Russian locales
- **Window opacity control** — Adjust transparency from 20% to 100%
- **Global shortcuts** — Customizable hotkey for show/hide window
- **Persistent configuration** — Settings saved locally in AppData

### 🎨 Modern UI/UX

- **Custom window controls** — Frameless design with native feel
- **Smooth animations** — Hardware-accelerated transitions
- **3D depth effects** — Beautiful gradients and shadows
- **Responsive layout** — Optimized for 1400×800 minimum resolution

## 🚀 Installation

### Download Pre-built Release

1. Go to [Releases](https://github.com/yourusername/deadlyze-app/releases)
2. Download `DeadLyze_0.1.0_x64-setup.exe`
3. Run the installer and follow the instructions

### Build from Source

```bash
# Clone repository
git clone https://github.com/DeadLyze/deadlyze-app.git
cd deadlyze-app

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build production release
npm run tauri build
```

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** TailwindCSS v4
- **Desktop:** Tauri 2.0 (Rust + WebView)
- **Internationalization:** i18next + react-i18next
- **Platform:** Windows 10/11 (x64)

## 📁 Project Structure

```
deadlyze-app/
├── src/                    # React frontend source
│   ├── components/         # UI components
│   │   ├── HomePage/       # Launch button & animations
│   │   ├── Layout/         # Sidebar, window controls
│   │   └── Settings/       # Settings modal & inputs
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── constants/          # App constants & styles
│   ├── i18n/               # Translations (en, ru)
│   └── utils/              # Helpers & managers
├── src-tauri/              # Rust backend
│   └── src/
│       └── main.rs         # Tauri commands & logic
├── deadlock-api-scripts/   # API exploration scripts (Rust)
└── public/                 # Static assets
```

## 🤝 Contributing

Currently, this project is in early development. Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under **[Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)**.

**You may:**

- ✅ Share and adapt the code
- ✅ Use for personal projects
- ✅ Fork and modify

**You must:**

- 📝 Give appropriate credit
- 🔗 Provide link to license
- 📌 Indicate if changes were made

**You cannot:**

- ❌ Use for commercial purposes
- ❌ Sell or monetize
