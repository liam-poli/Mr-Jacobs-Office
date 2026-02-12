# Mr. Jacobs' Office

**J.A.C.O.B.S.** — Just Another Corporate Office Behavior System

Escape a corporate office simulation controlled by a deranged AI named Mr. Jacobs. Every interaction is AI-generated, every outcome is dynamic, and there are infinite ways to win — or lose. No two playthroughs are the same.

Built for the [Supercell Global AI Game Hackathon](https://discord.gg/bQ29YpdQ75) (February 2026).

**▶ [Watch the demo](https://www.youtube.com/watch?v=7jAb_yPZwV0)**

[![Watch the demo](https://img.youtube.com/vi/7jAb_yPZwV0/maxresdefault.jpg)](https://www.youtube.com/watch?v=7jAb_yPZwV0)

## How It Works

You wake up inside a retro corporate office. Your boss is an AI displayed on a CRT monitor. He assigns tasks, reviews your performance, and controls the entire simulation. His mood is real — powered by an LLM that processes every action you take and reacts with speech, world changes, and environmental effects.

- **AI-driven interactions** — Use items on objects and get dynamically generated outcomes, cached for consistency and cost efficiency
- **Reactive AI boss** — Jacobs watches your actions, reacts emotionally, and his mood affects the world: music intensity, background visuals, screen glitches, and tile distortion all scale with his mental state
- **AI task generation & review** — Jobs are procedurally generated from the object catalog. Jacobs reviews your performance with AI-generated feedback and scoring
- **Multi-room exploration** — Navigate between rooms through portal doors, discover items, and interact with office objects
- **Retro CRT aesthetic** — Pixel art sprites, matrix rain background, monochrome HUD, and a glitchy terminal interface

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Game Engine | Phaser 3 |
| Styling | Tailwind CSS v4 |
| Audio | Howler.js |
| State | Zustand (React <-> Phaser bridge) |
| Backend | Supabase (Postgres + Edge Functions + Realtime) |
| AI | OpenAI / Anthropic / Google Gemini (swappable) |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Start local Supabase
npx supabase start
```

## Credits

- Player sprite generated with [Pixel Citizen by jbunke](https://jbunke.itch.io/pixel-citizen)
- Sound effects from [freesound.org](https://freesound.org)
- Font: [Silkscreen](https://fonts.google.com/specimen/Silkscreen) (OFL)

## License

[MIT](LICENSE)
