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
- [x] Room definitions stored in Supabase `rooms` table (layout, objects, items, furniture)
- [x] OfficeScene loads room from DB with fallback to DEFAULT_ROOM
- [x] Objects placed from DB catalog with tags and initial state
- [x] Procedural textures for furniture, state indicators (lock, power, broken)
- [ ] Objects display visual state indicators polished (sparks, glow, puddles)

### 3. Player Movement
- [x] Player sprite with walk animation
- [x] Keyboard input (WASD / arrow keys)
- [x] Collision with walls and objects
- [x] Player faces direction of movement

### 4. Items & Inventory
- [x] Item definitions stored in Supabase `items` table (name, tags, sprite)
- [x] AI-generated sprites for items via Replicate Flux 2 Pro + rembg
- [x] Items spawned in room at runtime from catalog (placed on desks, shelves, floor)
- [x] Player walks near item → pickup prompt
- [x] Items added to inventory (3–4 slots)
- [x] React inventory UI overlay (shows held items with their tags)
- [x] Drop item back to world

### 5. Object Interactions
- [x] Player walks near object → interact prompt
- [ ] "Use item on object" action (select item from inventory, apply to object)
- [ ] Hash-based interaction cache (`interactions` table, see `docs/plans/interaction-engine.md`)
- [ ] `interact` edge function: hash lookup → instant on cache hit, AI fallback on miss → store result
- [ ] Object state updates visually (e.g., LOCKED → UNLOCKED, POWERED → BROKEN)
- [ ] New item created from interaction goes to inventory (e.g., Knife + Coffee Bag → Coffee Grounds)
- [ ] Item consumed on use
- [ ] Seed 8–10 common interactions so game works without AI calls

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
- [x] Separate `/admin` route with password gate
- [x] Tags tab — full CRUD for tags (name, category badges)
- [x] Objects tab — full CRUD for object definitions (name, tags, state, sprite preview + AI generation)
- [x] Items tab — full CRUD for item definitions (name, tags, sprite preview + AI generation)
- [x] Rooms tab — view room definitions from Supabase
- [ ] Interactions tab — CRUD for cached interaction results (see `docs/plans/interaction-engine.md`)
- [ ] Player overview — state, inventory, Bucks, job, quota progress
- [ ] Mr. Jacobs status — current mood, per-player attention levels
- [ ] Interaction log — live feed of item-on-object and item-on-player actions
- [ ] Terminal log — history of all player ↔ Mr. Jacobs conversations
- [ ] Manual overrides — change object states, give/remove items, adjust Bucks, shift Mr. Jacobs' mood

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
- [x] Room definitions stored in Supabase `rooms` table (name, width, height, objects, items)
- [x] Admin RoomsTab for viewing/managing room definitions
- [ ] 3–4 room layouts created (Break Room, Server Room, Supply Closet, Boss's Office)
- [ ] Rooms connected by doors/hallways — player moves between them
- [ ] Each room type spawns objects and items from catalog at runtime
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
- [ ] Supabase Realtime broadcasts for player positions and actions
- [ ] Zustand stores sync runtime state (not direct DB writes for every move)
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
