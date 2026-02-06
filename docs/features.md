# Features: Mr. Jacobs' Office

## The Core Loop
- Players clock in, get assigned absurd jobs by Mr. Jacobs, and earn Bucks by completing them
- Spend Bucks at Terminals to talk to Mr. Jacobs — bribe, flatter, snitch, or investigate escape clues
- Spend Bucks at the Vending Machine for mystery items (purchases are tracked by the boss)
- Discover and execute one of several escape routes before the 30-minute session ends
- If the office quota isn't met, Mr. Jacobs gets disappointed — hazards, lockdowns, and firings follow

## Mr. Jacobs (The AI Boss)
- Fully AI-driven personality — earnest, erratic, manipulable, holds grudges
- Mood system (Pleased → Neutral → Suspicious → Disappointed → Unhinged) affects the whole office
- Per-player attention tracking (Favorite → Noticed → Watched → Targeted)
- Can change object states, reassign jobs, trigger events, and fire players
- Can only see through cameras — blind spots are safe zones for scheming
- Represented by bit-screens on walls with emotion-driven pixel faces
- Unique lore generated each session, connecting to a larger mystery over time

## Systemic Interactions (Tag & State System)
- Objects have Tags (permanent: `METALLIC`, `WOODEN`, `ELECTRONIC`) and States (mutable: `LOCKED`, `POWERED`, `BROKEN`)
- Items have Tags (`SHARP`, `WET`, `MAGNETIC`, `HOT`, etc.) and are consumed on use
- Players have States (`WET`, `CAFFEINATED`, `ELECTROCUTED`, `SUSPICIOUS`, etc.)
- Use items on objects or players — the system resolves outcomes via tag matching
- Common interactions resolved instantly from a cached lookup table
- Edge cases interpreted by the AI Logic Engine for creative, emergent solutions
- State changes trigger visual effectors (sparks, fire, glitch effects, puddles)

## Escape Routes
- **Collective Exit** — all players cooperate to trigger a shared objective (everyone escapes)
- **The Promotion** — manipulate Mr. Jacobs into promoting you out (1 player escapes)
- **Glitch Exploit** — chain systemic interactions to break the simulation (1–2 escape)
- **The Sacrifice** — get another player fired to destabilize the sim and slip out (1 escapes)
- Escape conditions are hidden — discovered through exploration, terminal conversations, and lore clues
- If nobody escapes in 30 minutes, Mr. Jacobs closes the office — everyone loses

## The Bucks Economy
- Earn by completing jobs, bonuses from Mr. Jacobs, or finding hidden stashes
- Spend on terminal conversations, vending machine items, or bribes
- Core tension: earning requires being visible, escaping requires spending
- Vending Machine purchases create a paper trail the boss can see

## Social & Multiplayer
- 4 players per session via Supabase Realtime
- Give items to other players (cooperate or plant evidence)
- Use items on players to change their state (coffee to help, glue to hinder)
- Proximity-based communication — no global chat
- Private terminal conversations — Mr. Jacobs may leak what you said
- Information asymmetry drives the mind game: what you share and what you hide matters

## Jobs
- Assigned by Mr. Jacobs at session start with a quota
- Require finding items and using them on objects (e.g., "Brew 3 coffees")
- Mr. Jacobs can promote, demote, or stack multiple jobs on a player mid-session
- Terminal conversations can influence job assignments for yourself or others

## Events
- Mandatory Meetings — report to the Boss's Office or raise suspicion
- Office Parties — social opportunities while Mr. Jacobs is distracted
- Lockdowns — rooms seal shut, trapping players inside
- Camera Malfunctions — temporary blind spots, opportunity windows
- Inspections — Mr. Jacobs checks a player's inventory or progress
- Quota Adjustments — targets shift mid-session, negotiable at the terminal

## The Dynamic World
- Office layout generated each session from preloaded room shapes
- Rooms connected by doors/hallways into a unique map
- Room types (Break Room, Server Room, Supply Closet, Boss's Office) define object spawns
- Camera placement varies — some rooms fully watched, others are blind spots
- Cameras can be broken through systemic interactions

## Aesthetic
- Retro-glitch 80s office — CRT terminals, pixel art, unsettling corporate atmosphere
- Bit-screen faces for Mr. Jacobs with emotion states
- Visual effectors tied to object states (sparks, fire, puddles, glitch artifacts)
- Severance-style soundtrack and spatial audio
