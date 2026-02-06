# Task List: Mr. Jacobs' Office

## Day 1 — Vertical Slice
**Goal:** One player in one room. Pick up items, use them on objects, see state changes, talk to Mr. Jacobs at a terminal. Mr. Jacobs reacts on the bit-screen.

### 1. Project Setup
- [x] Vite + React + TypeScript scaffold
- [x] Phaser 3 embedded in React (game canvas + React UI overlay)
- [x] Tailwind CSS configured
- [x] Zustand store (player state, inventory, Bucks)
- [x] Supabase project + client setup (DB, Auth, Edge Functions)
- [x] Folder structure and basic routing

### 2. The Room
- [ ] Single room tilemap (top-down/isometric) with walls, floor, furniture
- [ ] Objects placed in the room (Coffee Maker, Filing Cabinet, Door, Terminal, Vending Machine)
- [ ] Each object has Tags and an initial State
- [ ] Objects display visual state indicators (locked icon, powered glow, etc.)

### 3. Player Movement
- [x] Player sprite with walk animation
- [x] Keyboard input (WASD / arrow keys)
- [x] Collision with walls and objects
- [x] Player faces direction of movement

### 4. Items & Inventory
- [ ] Items spawned in the room (on desks, shelves, floor)
- [ ] Player walks near item → pickup prompt
- [ ] Items added to inventory (3–4 slots)
- [ ] React inventory UI overlay (shows held items with their tags)dwd
d

### 5. Object Interactions
- [ ] Player walks near object → interact prompt
- [ ] "Use item on object" action (select item from inventory, apply to object)
- [ ] Tag-matching logic resolves outcome (cached lookup table)
- [ ] Object state updates visually (e.g., LOCKED → UNLOCKED, POWERED → BROKEN)
- [ ] New item created from interaction goes to inventory (e.g., Knife + Coffee Bag → Coffee Grounds)
- [ ] Item consumed on use
- [ ] AI fallback for interactions not in the cache (edge cases)

### 6. Mr. Jacobs — Bit-Screen
- [ ] Bit-screen object on the wall displaying Mr. Jacobs' face
- [ ] Face changes with mood (Pleased, Neutral, Suspicious, Disappointed, Unhinged)
- [ ] Mr. Jacobs comments on events via speech bubble or text overlay
- [ ] Reacts to object state changes in camera view (e.g., something breaks → comment)

### 7. Mr. Jacobs — Terminal
- [ ] Terminal object in the room, player interacts to open chat UI
- [ ] React chat overlay — type messages, see Mr. Jacobs' responses
- [ ] Powered by AI API (Anthropic/OpenAI) with Mr. Jacobs' personality prompt
- [ ] Each message costs Bucks (deducted from player store)
- [ ] Mr. Jacobs' responses can reference world state (what objects are broken, player's job, etc.)

### 8. Bucks & Jobs (Minimal)
- [ ] Player starts with a job title and quota (hardcoded for now)
- [ ] HUD shows: Bucks, current job, quota progress
- [ ] Completing a job task (e.g., use item on correct object) awards Bucks
- [ ] Bucks deducted on terminal use

### 9. Admin Panel
- [ ] Separate `/admin` route (React page, not in-game)
- [x] Live view of all objects — current tags, states
- [ ] Live view of all items — where they are (world, inventory, consumed)
- [ ] Player overview — state, inventory, Bucks, job, quota progress
- [ ] Mr. Jacobs status — current mood, per-player attention levels
- [ ] Interaction log — feed of every item-on-object and item-on-player action with results
- [ ] Terminal log — history of all player ↔ Mr. Jacobs conversations
- [ ] Manual overrides — change object states, give/remove items, adjust Bucks, shift Mr. Jacobs' mood (dev tools)

---

## Day 2 — The Full Game
**Goal:** Play a complete 30-minute session solo with 3 AI players. All systems live — jobs, escape routes, events, Mr. Jacobs' full behavior.

### 10. Session Loop
- [ ] 30-minute game timer with HUD countdown
- [ ] 3-act pacing: Clock In (0–10), The Grind (10–20), The Review (20–30)
- [ ] Session start: Mr. Jacobs introduces himself, assigns jobs, sets the quota
- [ ] Performance Review trigger — collective quota check at act 3
- [ ] Mr. Jacobs mood escalation when quota isn't met (Suspicious → Disappointed → Unhinged)
- [ ] Session end states: escape, fired, or clock runs out (everyone loses)

### 11. Multiple Rooms
- [ ] 3–4 preloaded room layouts (Break Room, Server Room, Supply Closet, Boss's Office)
- [ ] Rooms connected by doors/hallways — player moves between them
- [ ] Each room type spawns appropriate objects and items
- [ ] Camera placement per room — some fully watched, some blind spots
- [ ] Camera indicators visible to the player

### 12. AI Players (Bots)
- [ ] 3 AI-controlled players that move, pick up items, and do their jobs
- [ ] Bots use items on objects to complete tasks (basic goal-seeking behavior)
- [ ] Bots visit the terminal occasionally
- [ ] Bots can be interacted with — give items to them, use items on them
- [ ] Bot behavior visible to Mr. Jacobs through cameras
- [ ] Bots don't need to be smart — just active enough to make the office feel alive

### 13. Mr. Jacobs — Full Behavior
- [ ] Mood shifts dynamically based on office events (quota progress, player actions, world state)
- [ ] Per-player attention tracking (Favorite → Noticed → Watched → Targeted)
- [ ] Proactive commentary — Mr. Jacobs speaks unprompted via bit-screens during events
- [ ] Mr. Jacobs reacts differently in terminal based on mood and player attention level
- [ ] Can fire a player (elimination) when sufficiently Disappointed
- [ ] Session lore generation — unique Mr. Jacobs backstory each game

### 14. Jobs — Full System
- [ ] AI-generated job assignments (not hardcoded)
- [ ] Multiple job types with varied tasks
- [ ] Mid-session job changes — promotions, demotions, stacking
- [ ] Terminal conversations can influence job assignments

### 15. Escape Routes
- [ ] Collective Exit — shared objective across rooms, requires coordination
- [ ] The Promotion — earn Favorite status + spend Bucks at terminal to escape
- [ ] Glitch Exploit — chain specific state changes to break the simulation
- [ ] The Sacrifice — get another player fired to create an exit
- [ ] Escape clues embedded in Mr. Jacobs' dialogue and environmental details
- [ ] Escape trigger + win screen

### 16. Events
- [ ] Mr. Jacobs triggers events on a timer or based on mood
- [ ] Mandatory Meeting — all players summoned to Boss's Office
- [ ] Lockdown — rooms seal, players trapped
- [ ] Camera Malfunction — temporary blind spots
- [ ] Inspection — Mr. Jacobs checks a player's inventory
- [ ] Quota Adjustment — targets shift mid-session

### 17. Social Interactions
- [ ] Use items on other players (state changes: WET, CAFFEINATED, BLEEDING, etc.)
- [ ] Give items to other players
- [ ] Player state effects (SLOWED movement, BLEEDING trail, etc.)
- [ ] Vending Machine — spend Bucks on mystery items, paper trail logged

---

## Day 3 — Polish & Multiplayer
**Goal:** Make it look and feel great. Replace bots with real players if time allows. Record the demo.

### 18. Multiplayer (Stretch)
- [ ] Supabase Realtime — sync player positions, actions, and world state
- [ ] Replace AI bots with real player connections
- [ ] Handle player join/leave
- [ ] Proximity-based communication (local chat or emotes)

### 19. Visual Polish
- [ ] CRT scanline / glitch shader overlay
- [ ] Bit-screen face animations (smooth transitions between moods)
- [ ] Object state effectors polished (fire, sparks, puddles, glitch artifacts)
- [ ] UI polish — terminal chat, inventory, HUD all styled to the retro-glitch aesthetic
- [ ] Player sprite polish and animations

### 20. Audio
- [ ] Severance-style ambient soundtrack
- [ ] Spatial audio (Howler.js) — sounds positioned in the office
- [ ] UI sounds (pickup, interact, terminal open/close, Bucks earned/spent)
- [ ] Mr. Jacobs' bit-screen sounds (mood shifts, speech cues)
- [ ] Environmental audio (hum of electronics, door sounds, fire crackle)

### 21. Tuning & Balance
- [ ] Bucks economy balance (earn rate vs. spend costs)
- [ ] Job difficulty and quota balance for 30-minute session
- [ ] Mr. Jacobs mood escalation pacing
- [ ] Escape route difficulty — achievable but not trivial
- [ ] AI bot behavior tuning

### 22. Demo & Submission
- [ ] Record demo video showing a full session
- [ ] Clean up repo — remove API keys, add README with setup instructions
- [ ] Submit on Junction platform before Sunday 11:59 PM JST
