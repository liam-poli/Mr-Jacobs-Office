# J.A.C.O.B.S. Office - Claude Code Guidelines

## Project Overview
Mr. Jacobs' Office (J.A.C.O.B.S.: Just Another Corporate Office Behavior System) is a multiplayer AI social simulation game. "Among Us meets Severance." 4 players trapped in a glitchy 80s office run by an unhinged AI boss. Built for the Supercell Global AI Game Hackathon (Feb 2026).

See `docs/overview.md` for full game design and `docs/tech-stack.md` for the technical stack.

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Game Engine**: Phaser 3
- **Styling**: Tailwind CSS
- **Audio**: Howler.js
- **State**: Zustand (React <-> Phaser bridge)
- **Backend**: Supabase (Postgres, Auth, Edge Functions, Realtime)
- **AI**: OpenAI / Anthropic / Google Gemini (swappable providers)
- **Multiplayer**: Supabase Realtime (WebSockets)

## Key Commands
- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npx supabase functions deploy <name>` - Deploy an edge function
- `npx supabase start` - Start local Supabase

## Project Structure
```
src/
  components/     # React UI (Terminal, HUD, Inventory, Vending Machine)
  scenes/         # Phaser scenes (office, rooms)
  services/       # API/logic layer (ai, supabase, sound, interaction)
  stores/         # Zustand stores (player, world, game state)
  types/          # TypeScript types and interfaces
  assets/         # Sprites, tilesets, audio
public/           # Static assets
supabase/
  functions/      # Edge Functions (interact, jacobsAI, etc.)
  migrations/     # Database schema
docs/             # Design docs, brainstorms, mockups
```

## Core Architecture
1. **Phaser** renders the 2D office world and detects interactions
2. **React** overlays UI panels (Terminal, Inventory, HUD)
3. **Zustand** bridges state between Phaser and React
4. **Supabase Edge Functions** handle AI logic server-side (API keys hidden)
5. **Supabase Realtime** syncs world state across 4 players
6. **AI** interprets tag/state interactions and powers Mr. Jacobs' personality

## Game Entities
- **Objects**: World fixtures with Tags + States (e.g., coffee machine `[METALLIC, ELECTRONIC]` `[POWERED]`)
- **Items**: Portable resources with Tags (e.g., bucket `[WET, HEAVY]`)
- **Players**: Have States only (e.g., `[CAFFEINATED]`, `[SUSPICIOUS]`)
- Tags and States come from predefined lists to prevent AI drift

## Important Patterns
- AI responses are cached in Postgres (hash input -> result) to save API costs
- Edge Functions proxy all AI calls — never expose API keys client-side
- Phaser handles rendering/physics, React handles UI — they communicate via Zustand stores
- All multiplayer state changes go through Supabase Realtime broadcasts
