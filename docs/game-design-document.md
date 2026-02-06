# Game Design Document: Mr. Jacobs' Office

## 1. Concept

**Elevator Pitch:** "Among Us meets Severance" — a 4-player social simulation where you're trapped in a glitchy 80s office run by an unhinged AI boss. Do your job, earn Bucks, manipulate the boss, and escape the simulation — together or at each other's expense.

**Genre:** Multiplayer social deduction / systemic simulation
**Players:** 4
**Session Length:** ~30 minutes
**Perspective:** Top-down / isometric 2D (Phaser 3)
**Aesthetic:** Retro-glitch 80s office — CRT screens, pixel art, bit-screen faces, unsettling corporate atmosphere

---

## 2. Session Structure

A session follows a 3-act arc across ~30 minutes.

### Act 1: Clock In (Minutes 0–10)
- Players spawn in the office lobby and are assigned **jobs** by Mr. Jacobs.
- Each player receives a job title and a quota (e.g., "Paper Carrier — Deliver 5 memos").
- Players explore, learn the room layout, find items, and start working.
- Bucks start flowing as players complete tasks.
- Mr. Jacobs is relatively calm — occasional commentary, light instructions.

### Act 2: The Grind (Minutes 10–20)
- Players have earned enough Bucks to start using **Terminals** — talking directly to Mr. Jacobs.
- Escape clues begin surfacing through terminal conversations, environmental details, and Mr. Jacobs' dialogue.
- Alliances form. Players start deciding: cooperate or compete?
- Mr. Jacobs may **change jobs** mid-session — promotions, demotions, or stacking multiple roles on one player.
- **Side events** trigger: mandatory meetings, office parties, camera malfunctions, environmental hazards.
- Tension builds as players balance earning Bucks, investigating escape routes, and watching each other.

### Act 3: The Review (Minutes 20–30)
- The **Performance Review** approaches. If the collective office quota isn't met, Mr. Jacobs gets "disappointed."
- Disappointment escalates: environmental hazards, room lockdowns, surveillance increases, or outright "firings" (elimination).
- Players commit to their escape path. Betrayals happen here.
- The session ends when: players escape, everyone gets fired, or the clock runs out (Mr. Jacobs "closes the office" — everyone loses).

---

## 3. Mr. Jacobs

### Personality
Mr. Jacobs is the AI boss. He built this office simulation but doesn't fully understand what a real office is. He's earnest, erratic, and slightly threatening — like a middle manager with god powers and no social awareness. He can be flattered, manipulated, bribed, and lied to — but he's also unpredictable and holds grudges.

Each session generates a **unique Mr. Jacobs lore** — his origin story, quirks, and obsessions shift. This affects his dialogue, the escape conditions, and the tone of the session. Over multiple sessions, these lore fragments connect to a larger mystery.

### Behavior Model
Mr. Jacobs has two key internal states:

**Mood** (affects global behavior):
- `PLEASED` — Calm, generous. May give bonuses or relax quotas.
- `NEUTRAL` — Standard operations.
- `SUSPICIOUS` — Starts watching players more closely, asks pointed questions.
- `DISAPPOINTED` — Triggers hazards, lockdowns, firings.
- `UNHINGED` — Full chaos. Environment destabilizes. Last resort before session collapse.

**Attention** (per-player relationship):
- `FAVORITE` — Player is in good standing. Gets easier jobs, tips, possibly escape hints.
- `NOTICED` — Normal.
- `WATCHED` — Mr. Jacobs is keeping an eye on this player. More camera focus.
- `TARGETED` — Player is on thin ice. One wrong move and they're fired.

### Powers & Limits
**Mr. Jacobs can:**
- Change the state of any object in the world
- Reassign jobs, promote, or demote players
- Trigger events (parties, lockdowns, hazard spawns)
- Speak to all players via bit-screens or to individuals via terminals
- "Fire" players (eliminate them) if sufficiently DISAPPOINTED

**Mr. Jacobs cannot:**
- See areas without cameras (his major weakness)
- Act on information he hasn't "observed" through cameras or terminal conversations
- Directly move or harm players (he acts through the environment, not direct force)
- Resist flattery or bribery entirely (he's susceptible, even if he doesn't admit it)

### The Bit-Screens
Mr. Jacobs is visually represented by screens mounted on walls showing a pixelated face. His emotion states map to face expressions:
- `PLEASED` — Smile, relaxed eyes
- `NEUTRAL` — Flat expression
- `SUSPICIOUS` — Narrowed eyes, slight frown
- `DISAPPOINTED` — Visible frown, glitch artifacts
- `UNHINGED` — Face distorts, screen flickers, visual corruption

---

## 4. Escape Routes

Players don't know which escape routes are available at the start. They must **discover** the paths through exploration, terminal conversations, and piecing together clues. Mr. Jacobs unknowingly holds the keys — he leaks information without realizing it.

### The Collective Exit (All players escape)
- Requires all 4 players to cooperate on a shared objective.
- Typically involves putting specific objects across different rooms into specific states simultaneously.
- Hard to coordinate, requires trust, and is undermined if even one player defects.
- Clues come from Mr. Jacobs' environmental hints and lore details.

### The Promotion (1 player escapes)
- Manipulate Mr. Jacobs through terminal conversations until he "promotes" you out of the simulation.
- Costs significant Bucks over multiple terminal sessions.
- Competitive — Mr. Jacobs only promotes one. Other players can snitch or undercut your standing.
- Requires reaching `FAVORITE` status while keeping Mr. Jacobs in `PLEASED` or `NEUTRAL` mood.

### The Glitch Exploit (1–2 players escape)
- Chain systemic interactions to break the simulation.
- Requires discovering a specific sequence of state changes — e.g., getting 3+ objects into `[BROKEN]` state in the same room, or creating a loop the simulation can't resolve.
- The conditions are embedded in the session's lore. Terminal conversations and environmental clues reveal what the simulation's "weak points" are.
- Can be done quietly in camera blind spots.

### The Sacrifice (1 player escapes)
- Get another player "fired" by Mr. Jacobs. Their elimination destabilizes the simulation enough to create an exit for you.
- Methods: snitch on them via the terminal, frame them by planting items, sabotage their job to make them miss quota.
- Dark and risky — if Mr. Jacobs catches on to the manipulation, the schemer gets targeted instead.

### Failure State
If no one escapes by the 30-minute mark, Mr. Jacobs "closes the office." Everyone loses. The simulation shuts down and Mr. Jacobs delivers a disappointed monologue.

---

## 5. The Bucks Economy

**Bucks** are the universal currency. They create the core tension: spend on survival, spend on escape, or spend on sabotage.

### Earning Bucks
- **Completing job tasks** — Primary income. Each completed task pays a set amount.
- **Mr. Jacobs' bonuses** — Occasional rewards for good behavior, completing side tasks, or being his `FAVORITE`.
- **Finding Bucks** — Occasionally hidden in the environment or dropped from interactions.

### Spending Bucks
| Action | Cost | Notes |
|---|---|---|
| Terminal conversation | Medium | Each message to Mr. Jacobs costs Bucks. Longer conversations drain fast. |
| Vending Machine item | Variable | "Mystery Office Supplies" — random item pulls. Creates a paper trail Mr. Jacobs can see. |
| Bribing Mr. Jacobs | High | Direct terminal bribe to shift his mood or attention. Not guaranteed to work. |

### Economy Tension
- Earning requires doing your job (visible, predictable, safe).
- Escaping requires spending (terminals, items, bribes).
- Players who hoard Bucks look suspicious. Players who spend freely run out.
- The Vending Machine creates a **paper trail** — Mr. Jacobs knows what you bought, which can raise suspicion.

---

## 6. The Systemic Interaction Model

### Core Concepts
The world runs on a strict **Tag + State** system that keeps AI interactions grounded and predictable.

- **Objects** (world fixtures): Have **Tags** (permanent properties) and **States** (changeable conditions).
- **Items** (portable, consumable): Have **Tags** (permanent properties). Items are used up on interaction.
- **Players**: Have **States** (changeable conditions). No tags.

### Tag Reference

| Tag | Applies To | Description |
|---|---|---|
| `METALLIC` | Objects, Items | Made of metal. Conducts electricity, affected by magnets. |
| `CONDUCTIVE` | Objects, Items | Can carry electrical current. |
| `WOODEN` | Objects, Items | Made of wood. Flammable, insulates. |
| `GLASS` | Objects, Items | Fragile, transparent. |
| `ELECTRONIC` | Objects | Has circuitry. Can be powered, hacked, or broken. |
| `HEAVY` | Objects, Items | Difficult to move. Can be used as a blocker or weapon. |
| `SHARP` | Items | Can cut, open, or damage. |
| `WET` | Items | Contains liquid. Can short-circuit, extinguish, or soak. |
| `MAGNETIC` | Items | Affects metallic objects. Can move or manipulate metal. |
| `HOT` | Items | High temperature. Can burn, melt, or heat. |
| `COLD` | Items | Low temperature. Can freeze, cool, or preserve. |
| `STICKY` | Items | Adheres to surfaces. Can trap or bind. |
| `FRAGILE` | Items | Breaks easily on impact. |
| `CHEMICAL` | Items | Reactive substance. Unpredictable interactions. |
| `ORGANIC` | Items | Food, plant matter. Can rot, attract pests, or be consumed. |
| `PAPER` | Items | Can be written on, burned, or folded. |

### State Reference

**Object States:**

| State | Description | Visual Effector |
|---|---|---|
| `LOCKED` | Cannot be used until unlocked. | Lock icon overlay. |
| `UNLOCKED` | Normal, usable state. | — |
| `POWERED` | Receiving electricity. Active and functional. | Glow/hum effect. |
| `UNPOWERED` | No electricity. Inactive. | Dark, no hum. |
| `BROKEN` | Destroyed or non-functional. | Spark particles, "OUT OF ORDER" label. |
| `BURNING` | On fire. Spreads to nearby flammable objects. | Fire particle effect. |
| `FLOODED` | Covered in water/liquid. Hazardous to electronics. | Water puddle sprite. |
| `JAMMED` | Mechanically stuck. Needs force or a tool. | Shaking animation. |
| `HACKED` | Overridden. Behaves unexpectedly. | Glitch screen effect. |
| `CONTAMINATED` | Chemically or biologically unsafe. | Green haze overlay. |

**Player States:**

| State | Effect | How Applied |
|---|---|---|
| `WET` | Vulnerable to electrocution near `CONDUCTIVE` objects. | `[WET]` item used on player. |
| `CAFFEINATED` | Speed boost for a short duration. | Drink coffee item. |
| `ELECTROCUTED` | Stunned briefly. Drops held item. | Touch `CONDUCTIVE` + `POWERED` while `WET`. |
| `BLEEDING` | Slow health drain. Leaves a visible trail. | `[SHARP]` item used on player. |
| `SLOWED` | Movement speed reduced. | `[STICKY]` item used on player. |
| `SUSPICIOUS` | Mr. Jacobs watches this player more. Cameras track them. | Triggered by Mr. Jacobs or player reports. |
| `BURNED` | Brief stun + visual indicator. | Contact with `BURNING` object or `[HOT]` item. |
| `FROZEN` | Brief immobilization. | `[COLD]` item used on player. |
| `PROMOTED` | Higher-tier job. Better pay, more scrutiny. | Mr. Jacobs decision. |
| `DEMOTED` | Lower-tier job. Less pay, less attention. | Mr. Jacobs decision. |

### Interaction Logic

When a player uses an **Item** on an **Object**, the system:

1. **Checks Tags** — Compares the Item's tags against the Object's tags.
2. **Resolves via Lookup** — Common interactions are resolved from a cached interaction table (fast, deterministic).
3. **Falls back to AI** — If no cached rule exists, the AI Logic Engine interprets the interaction based on tags, states, and game context (slower, creative).
4. **Applies State Change** — The Object's state updates in the database.
5. **Triggers Effectors** — Visual/audio effects fire based on the new state.
6. **Creates Item Output** — Some interactions produce a new item (e.g., Knife + Coffee Bag → Coffee Grounds).

**Example Cached Interactions:**

| Item Tags | Object Tags | Object State | Result State | Output Item |
|---|---|---|---|---|
| `[WET]` | `[CONDUCTIVE]` | `POWERED` | `BROKEN` | — |
| `[SHARP]` | `[WOODEN]` | `LOCKED` | `UNLOCKED` | Wood Shavings |
| `[MAGNETIC]` | `[METALLIC]` | `LOCKED` | `UNLOCKED` | — |
| `[HOT]` | `[WOODEN]` | any | `BURNING` | — |
| `[WET]` | any | `BURNING` | `UNPOWERED` | — |
| `[CHEMICAL]` | any | any | `CONTAMINATED` | — |
| `[HEAVY]` | `[GLASS]` | any | `BROKEN` | Glass Shards `[SHARP]` |

---

## 7. Items & Objects

### Item Rules
- Items exist in the world, in inventories, or are created from interactions.
- Items are **consumable** — using an item on an object or player uses it up (unless specified).
- Players can **carry** a limited number of items (suggest: 3–4 slots).
- Items can be **given** to other players, **dropped** in the world, or **used** on objects/players.

### Object Rules
- Objects are fixed world fixtures (desks, coffee makers, doors, terminals, vending machines).
- Objects have tags (permanent) and states (mutable).
- Mr. Jacobs can change object states remotely.
- State changes broadcast to all players via Supabase Realtime.

### The Vending Machine
- A special object where players spend Bucks on randomized items.
- Items are "Mystery Office Supplies" — you don't know exactly what you'll get.
- Every purchase is logged. Mr. Jacobs can see your purchase history and may comment on or react to suspicious buying patterns.

### The Terminal
- A special object where players talk directly to Mr. Jacobs.
- Each message costs Bucks.
- Multiple terminals exist across the office.
- Terminal conversations are **private** — other players can't see what you said (but Mr. Jacobs might reference it later).
- This is the primary tool for: earning favor, snitching, bribing, investigating escape routes, and manipulating Mr. Jacobs' mood.

---

## 8. The Dynamic World

### Room Generation
- The office is not a fixed map. Each session assembles rooms from a library of **preloaded room shapes**.
- Rooms are connected via doors/hallways to form a unique layout.
- Each room has a **type** (e.g., Break Room, Server Room, Supply Closet, Boss's Office) that defines what objects spawn inside.
- Mr. Jacobs' cameras are placed at generation time — some rooms have full coverage, others are blind spots.

### Camera System
- Mr. Jacobs can only observe and react to events in rooms **with cameras**.
- Players can identify camera locations visually.
- Blind spots are where conspiracies happen — trading items, planning sabotage, discussing escape.
- Some interactions may disable or redirect cameras (e.g., `[WET]` item on a camera → `BROKEN`).

---

## 9. Events

Mr. Jacobs triggers events throughout the session to disrupt routines and force social interaction.

| Event | Description |
|---|---|
| **Mandatory Meeting** | All players must go to the Boss's Office. Mr. Jacobs delivers a speech or makes announcements. Refusing raises suspicion. |
| **Office Party** | A "celebration" in the Break Room. Players are expected to attend. Good for social manipulation while Mr. Jacobs is distracted. |
| **Lockdown** | One or more rooms lock. Players trapped inside must wait or find a way out. |
| **Camera Malfunction** | Cameras in a section go dark temporarily. Mr. Jacobs panics. Opportunity window. |
| **Inspection** | Mr. Jacobs checks a specific player's inventory or job progress. Being caught with suspicious items is bad. |
| **Quota Adjustment** | Mr. Jacobs changes the quota mid-session — up or down. Can be negotiated at the terminal. |
| **New Hire** | A "ghost" NPC appears briefly. Red herring or clue, depending on the session's lore. |

---

## 10. Jobs

### Job Assignment
- At session start, each player gets a **job title** and **quota** from Mr. Jacobs.
- Jobs require finding items and using them on specific objects (e.g., "Brew 3 coffees" = use Coffee Grounds on Coffee Maker 3 times).
- Jobs are the primary source of Bucks.

### Job Mobility
- Mr. Jacobs can **promote** or **demote** players mid-session.
- Promotions: better pay, harder tasks, more scrutiny from Mr. Jacobs.
- Demotions: less pay, easier tasks, less attention (can be strategically useful).
- Players can be assigned **multiple jobs** simultaneously.
- Terminal conversations can influence job assignments ("I think Dave would be better at filing...").

---

## 11. Social Mechanics

### Player-to-Player Interactions
- **Give Item** — Hand an item to another player. Can be cooperative (sharing resources) or strategic (planting evidence).
- **Use Item on Player** — Apply an item directly to change their state. Can be helpful (coffee → `CAFFEINATED`) or hostile (knife → `BLEEDING`).
- **Proximity Chat / Emotes** — Players near each other can communicate. Communication is local, not global.

### Information Asymmetry
- Terminal conversations are private.
- Mr. Jacobs only shares what he chooses to share.
- Camera blind spots hide actions from Mr. Jacobs but not from nearby players.
- Item purchases at the Vending Machine are tracked by Mr. Jacobs but not visible to other players.
- Players must decide what to share, what to hide, and who to trust.

---

## 12. Hackathon MVP Scope

For the 48-hour build, prioritize in this order:

### Must Have (The Core Loop)
1. Single room with player movement and object interaction
2. Tag/State system with cached interaction table
3. Item pickup, inventory (3–4 slots), use on objects
4. The Terminal — chat with Mr. Jacobs (AI-powered)
5. Mr. Jacobs' bit-screen with mood/emotion display
6. Bucks economy (earn from jobs, spend at terminal)
7. Basic job assignment and quota tracking

### Should Have (The Social Layer)
8. Second player via Supabase Realtime
9. Item use on players (state changes)
10. Give items between players
11. Camera system (visual indicator of observed vs. blind spots)
12. Vending Machine

### Nice to Have (The Polish)
13. 4-player support
14. Dynamic room generation (multiple connected rooms)
15. Events system
16. Escape route discovery and execution
17. Audio / soundscape
18. CRT visual filters and glitch effects
