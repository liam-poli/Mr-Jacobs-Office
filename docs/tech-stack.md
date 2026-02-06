# Technical Stack: J.A.C.O.B.S. Office

## Frontend & Game Engine
- **React (Vite) + TypeScript**: For the UI layers (Terminal, Vending Machine, Inventory, HUD).
- **Phaser 3**: For the 2D office simulation, player movement, and object rendering.
- **Tailwind CSS**: For styling the "Retro-Glitch" UI.
- **Howler.js**: For the "Retro-Glitch" soundscape and spatial audio.

## Backend & Persistence
- **Supabase**: 
  - **PostgreSQL**: Stores the "World State" (Object states, Item tags, Player stats).
  - **Auth**: Handles player sessions.
  - **Edge Functions**: To run the J.A.C.O.B.S. AI logic securely.

## AI Engine
- **OpenAI / Anthropic / Google Gemini API**: Powers J.A.C.O.B.S.' personality and the "Systemic Interpreter" for item/object interactions. Multiple providers supported to test quality, speed, and cost.

## Multiplayer
- **Supabase Realtime**: WebSocket-based state synchronization between the 4 players. Broadcasts world state changes (object states, item locations, player actions) using the existing Supabase infrastructure.

## Key Packages & Libraries (Inspired by Infinite Kitchen)
- **phaser**: Core 2D game engine.
- **phaser3-rex-plugins**: Essential for advanced Phaser features (like UI components, text effects).
- **@supabase/supabase-js**: Database, Auth, and Edge Function client.
- **howler**: For the "Retro-Glitch" soundscape and spatial audio.
- **framer-motion**: For smooth React UI transitions (Terminal popups, HUD).
- **lucide-react**: For consistent UI iconography.
- **canvas-confetti**: For "Promotion" celebrations.
- **clsx & tailwind-merge**: For clean dynamic styling in the React layers.
- **vite-plugin-image-optimizer**: Critical for keeping retro assets small and fast-loading.
- **zustand**: For lightweight, global state management in React (syncing Player stats, Bucks, and Inventory between Phaser and the HUD).
