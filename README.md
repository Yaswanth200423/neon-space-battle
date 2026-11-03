# Neon Space Battle
Real-time multiplayer browser arena for 2–4 players. Node.js + Express + Socket.IO.

## Run locally
1. Install Node.js LTS.
2. Open this folder in VS Code and open Terminal.
3. Run `npm install`.
4. Run `npm start`.
5. Visit `http://localhost:3000` in a browser.
6. Create a room, copy its room code, open another browser tab and join using the same code.

## Controls
WASD / arrows: move; mouse: aim; Space or mouse button: shoot.

## Features
Authoritative server movement, hit detection, damage, kills, scoring, respawn, leaderboard, rooms (max 4).

## Deploy
Deploy as a Node.js web service (for example Render). Build command: `npm install`. Start command: `npm start`. The service must support WebSockets. Share the public URL for Handshake submission.

## Notes
Room and scores are in memory and reset on server restart. Game is a free-for-all arena; players automatically respawn after elimination.
