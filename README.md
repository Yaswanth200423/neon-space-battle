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

## Movement bug fix (November 2026)
The original server initialized player input as an empty object. Before the first input packet arrived, `Number(undefined)` produced `NaN`, which permanently corrupted the ship coordinates. This version initializes all movement keys to `false`, coerces input flags safely, and recovers invalid coordinates. The client also displays connection loss and allows rejoining after reconnection.

After redeploying, hard-refresh the game, click **LAUNCH INTO BATTLE**, and use WASD/arrow keys.

## Fighter jet and missile update (November 2026)
- Top-down twin-engine fighter jets replace triangular ships; jets rotate toward the mouse cursor.
- Projectile visuals are detailed missiles with nose cones, fins and animated exhaust.
- Launch swoosh and explosion sounds are generated locally with Web Audio; use the sound toggle in mission control.
- Server sends launch and impact events to everyone in the same room; damage remains server-authoritative.
- Browsers require a user gesture to enable sound: click Launch into Battle.
- Redeploy the ZIP contents to Render for the live URL to update.
