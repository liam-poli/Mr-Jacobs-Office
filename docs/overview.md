# Mr. Jacobs' Office: A Systemic AI Social Game

## Overview
**Mr. Jacobs' Office** (or **J.A.C.O.B.S.**: Just Another Corporate Office Behavior System) is a multiplayer social simulation where "Among Us meets Severance." You and 3 other players are trapped in an infinite, glitchy 80s office simulation run by **Mr. Jacobs**, an unhinged AI boss with a distinct, erratic personality. He doesn't quite understand what a "company" is, but he has total influence over the world and every object within it.

The game is a systemic simulation where every interaction is mediated by an AI that interprets the "physics" of the office based on a strict system of **Tags** and **States**.

## Core Game Loop
1. **Clock In**: Players are assigned absurd jobs and a daily quota by Mr. Jacobs.
2. **Work & Earn**: Complete jobs by finding items and using them on world objects to earn **Bucks**.
3. **The Terminal**: Spend Bucks at terminals to talk directly to Mr. Jacobs. Use this to negotiate reality, snitch on coworkers, or bribe your way toward a promotion.
4. **Job Progression**: Jobs can change mid-session — players can be promoted, demoted, or juggle multiple roles at once.
5. **Events**: Mr. Jacobs triggers office-wide events — parties, mandatory meetings in the boss's office, or other disruptions that force social interaction.
6. **The Performance Review**: If the office-wide quota isn't met, Mr. Jacobs gets "disappointed," leading to environmental hazards, lockdowns, or "firing" (elimination).
7. **Clock Out**: Escape the simulation by manipulating the AI and the environment, either together or by sacrificing your coworkers.

## Systemic Mechanics

### 1. The Tag & State System
To keep the AI's influence grounded and predictable, the world follows a "Systemic Sim" logic:
- **Objects**: Have **Tags** (e.g., `[METALLIC]`, `[CONDUCTIVE]`, `[BLOCKER]`) and **States** (e.g., `[LOCKED]`, `[POWERED]`, `[BROKEN]`).
- **Items**: Are disposable resources with **Tags** (e.g., `[WET]`, `[SHARP]`, `[HEAVY]`).
- **Players**: Have **States** (e.g., `[WET]`, `[ELECTROCUTED]`, `[SUSPICIOUS]`) but no tags.

### 2. AI-Mediated Interactions
When a player uses an **Item** on an **Object**, the AI acts as the Logic Engine:
1. It looks at the **Tags** of the Item and Object.
2. It determines if a **State Change** is possible based on a predefined list of effects (e.g., `Item[WET]` + `Object[CONDUCTIVE]` -> `State[BROKEN]`).
3. It determines if a **New Item** is created from the interaction (e.g., `Item[KNIFE]` + `Object[COFFEE_BAG]` -> `Item[COFFEE_GROUNDS]`).
4. It triggers **Effectors**: Visual or gameplay changes tied to states (e.g., a `[BROKEN]` state triggers a "spark" particle effect and an "out of order" icon).

### 3. Social Interaction & Item Use
Items are not just for objects; they are a core part of the social mind game:
- **Give**: Items can be traded or given to other players to coordinate on jobs.
- **Use on Players**: Items can be applied directly to players to change their state (e.g., `Item[KNIFE]` on `Player` -> `Player[BLEEDING]`, or `Item[COFFEE]` on `Player` -> `Player[CAFFEINATED]`).
- **Sabotage**: Use items to hinder others (e.g., `Item[GLUE]` on a player to make them `[SLOWED]`).

### 3. Emergent Gameplay
Because the AI interprets interactions on the fly, players can solve problems creatively. If a door is `[LOCKED]` and `[METALLIC]`, a player might use a `[MAGNETIC]` item to move the lock, or a `[WET]` item to short-circuit it. The AI validates the logic, updates the database, and the world changes for everyone.

## Key Features
- **Dynamic World**: The office is not a fixed map. Rooms and their contents are generated dynamically from preloaded shapes, connected together to form a unique layout each session.
- **Asymmetric Vision**: Mr. Jacobs only sees where there are cameras. Players can conspire in the "blind spots."
- **Dynamic Lore**: Each session generates a unique story about Mr. Jacobs' origins, connected to a persistent overarching mystery.
- **The "Bucks" Economy**: A high-stakes social currency used for both survival (buying tools) and sabotage (bribing the boss).
- **The Vending Machine**: A physical shop controlled by J.A.C.O.B.S. where players spend Bucks on "Mystery Office Supplies." Buying items creates a "paper trail" that the AI can use to track suspicious behavior.
- **Retro-Glitch Aesthetic**: An edgy, off-putting 80s office vibe with bit-screen faces and CRT terminal interfaces.
