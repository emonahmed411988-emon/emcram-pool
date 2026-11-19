# Carrom Pool — Android APK & Multiplayer Game

A clean-room, full-featured **Carrom Pool** mobile board game built with React, TypeScript, HTML5 Canvas 2D Rigid-Body Physics, Capacitor (Android `.apk`), and an optional Node.js + Socket.IO real-time multiplayer backend.

## Download Android APK

1. Open the **Releases** section on the right side of this GitHub repository (or open the **Actions → Build Android APK & Publish Release** tab).
2. Download **`CarromPool-Android.apk`**.
3. Open the `.apk` on your Android phone (allow "Install from unknown sources" if prompted) and play immediately!

## Key Features

- **3 Complete Game Modes**:
  - **Play Disc Pool** — 6-piece & 9-piece race to pot all your colored pucks first (Paris Stage, Delhi Lounge, Cairo Club, New York Arena, Singapore Hall).
  - **Play Carrom** — Authentic Red Queen + Cover rules with 6/9 pieces (Delhi Lounge, Paris Stage, Mumbai Club, Dubai Palace).
  - **Play Freestyle** — Points race (White = 20 pts, Black = 10 pts, Red Queen = 50 pts).
- **Precision 2D Carrom Physics**:
  - Sub-stepped 360Hz elastic disc collisions, smooth boric-powder glide friction, cushion rebounds, pocket lip pull, baseline striker slider, and drag-to-aim circle with power arrow & dotted trajectory preview.
- **Complete Progression & Economy**:
  - **Account System**: Instant `Guest_XXXXXXXXX` profile + full Account Creation / Sign In / Avatar picker / Career stats.
  - **Equipment**: Upgradeable Strikers (**Blaze**, **Astro**, **Pulse**, **Aura**, **Trace**, **Toran**, **Vortex**, **Ember**, **Titan**) with live Force/Aim/Time stats, Collection Power, Powers, Pucks, Trails & Pockets.
  - **Chests & Mini-Games**: 4 Chest Slots with unlock timers, animated Chest Opening, playable **Lucky Shot** bullseye canvas, **Spin & Win** wheel, 7-day **Free Rewards**, **Weekly Leaderboards**, **Events** & **Shop**.
- **Friends & Private Rooms (1v1 & 2v2)**:
  - Create Private Rooms (`1v1` or `2v2`, Disc Pool or Carrom), share 6-character Room Codes (e.g., `518HXP`), invite friends, play Pass-n-Play / AI Bots offline, or connect to the included Socket.IO server for live online rooms!

## Local Development

```bash
# Install frontend dependencies & start dev server
npm install
npm run dev

# Build production web bundle
npm run build
```

## Optional Live Multiplayer Server (LAN / Cloud)

```bash
cd server
npm install
npm start
# Server starts on http://localhost:3001
```
Enter your server URL inside the game's **Settings → Online Multiplayer Server** to enable live cross-device account sync & real-time Private Rooms!

## Build Android APK Locally

Requires **JDK 17** and **Android SDK (API 34)**:

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```
