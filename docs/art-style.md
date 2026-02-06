# Art Style Guide: Mr. Jacobs' Office

**Vibe:** Retro-glitch 80s corporate — somewhere between a Commodore 64 screensaver and the Lumon Industries basement. Unsettling, sterile, slightly wrong. Everything looks like it was designed by an AI that read one book about offices.

**Reference mockups:** See `/docs/mockups/`

---

## 1. General Style
- Pixel art, top-down / slight isometric perspective
- Muted, desaturated palette — institutional mint-green, beige, grey, fluorescent white
- Pops of color reserved for interactive elements (CRT cyan, item indicators, warning red)
- Everything is slightly too clean, too symmetrical — uncanny corporate perfection
- Flat fluorescent lighting, no warmth — the office never sees sunlight
- Glitch artifacts creep in as tension rises (scanlines, color shifts, static, tile corruption)

---

## 2. Environment
- Tile floors (mint-green/grey), beige wall panels, potted plants in corners
- Cubicle rows with old CRT computers at each desk — Severance-style open plan
- Repeating patterns and symmetry — the simulation doesn't understand variety
- Motivational posters that say slightly wrong things
- Room types differ in furniture and mood but share the same sterile palette
- Environmental degradation is visual — the cleaner it looks, the calmer Mr. Jacobs is

---

## 3. Players
- Small pixel-art characters (~32px), top-down with directional walk sprites
- Generic office worker look — shirt, slacks, muted tones
- Each player has a distinct color and a floating label with job title + number (e.g., "MACRODATA 2")
- Player states shown through simple visual effects on the sprite (drips, trails, overlays)

---

## 4. Mr. Jacobs
- Wall-mounted CRT screen with a simple smiley face — yellow circle, dot eyes, curved mouth
- Low-res, almost emoji-like — friendly but unsettling in context
- Face expression shifts with mood (smile → flat → frown → distorted)
- Speech delivered in a retro text box floating beside the screen (uppercase monospace)
- Screen static and visual noise increase as mood worsens

---

## 5. Items & Objects
- Items are small (~16x16), clear silhouettes, instantly readable at pixel scale
- Green arrow indicator over items on the ground (see pickup mockup)
- Objects are larger world fixtures — desks, machines, doors, terminals
- Subtle highlight or label appears when player is in interaction range
- State changes on objects are visually obvious (sparks, glow, puddles, overlays)

---

## 6. UI
- **HUD** — minimal, top-left corner. Monospace pixel font on a dark semi-transparent box
  - Line 1: `BUCKS: 150`
  - Line 2: `TASK: FILE SORT 04`
- **Inventory** — bottom of screen, simple slot bar
- **Interaction prompts** — floating labels near objects/items
- **Mr. Jacobs speech** — text box beside the CRT screen, uppercase, retro styled
- **Terminal chat** — fullscreen CRT overlay, green/amber text on black, blinking cursor, typewriter effect
- **Admin panel** — clean modern dashboard, intentionally contrasts the in-game retro style
- All in-game fonts are monospace / pixel

---

## 7. Audio & Music
- **Soundtrack:** Severance-inspired — eerie, minimal, unsettling calm. Sparse piano or synth pads.
- **Music reacts to mood** — calm muzak when things are fine, dissonant undertones when suspicious, distorted glitch audio when unhinged
- **Ambient:** fluorescent hum, keyboard clacking, distant phone ringing, air conditioning drone
- **Spatial audio:** sounds positioned in the world, volume/pan based on player distance
- **UI sounds:** soft clicks for pickup, beeps for terminal, cha-ching for Bucks

---

## 8. Reference Board

### Existing Mockups
- [Art style + office room](../docs/mockups/art_style_mockup.png)
- [Item pickup interaction](../docs/mockups/pickup_item_mockup.png)
- [Original concept mockup](../docs/mockups/mockup_1.png)

### Still Needed
- [ ] Mr. Jacobs faces (all mood states)
- [ ] Player sprites (idle, walk, state effects)
- [ ] Terminal chat screen
- [ ] Item icon sheet
- [ ] Environment glitch degradation
