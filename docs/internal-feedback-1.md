# Internal Feedback 1 — Feb 7 2026

## User Notes
- Get the UI looking closer to the refernce 
- Get the system of objects to match the refercene and get size working so they can be bigger than one block , see plants 
- Objects can be hand crafted for now its fine 
- Have an option to use images for tiles
- Add multiple angle support for tiles, human defined first 
- Make the backgrund for jacob and have pre made faces 
- Add shadows 
- Get doors working and moving into rooms 
- Get the size of items constant and in a better art style 
- General polish pass before you move on, get it feeling nice and making sense 
- Figure out termainl, vendaing mcahine and jacob nad how they work as objcets, maybe a highlgiht or somethign 
- Smaller first room, lock them in 
- Have a bit of black on the outside of the room, 

---

## Claude Notes

### Art Style Gap
- Current procedural textures (floor, wall, desk, plant) are functional but far from the mockup (`docs/mockups/art_style_mockup.png`)
- Mockup shows: mint-green beveled floor tiles, walls with baseboard depth, desks with CRT monitors + keyboards, detailed potted plants, cubicle rows with dividers
- Current: blue-gray flat floor, flat beige walls, plain brown desk squares, basic green blob plant
- Tried a quick procedural pass but it needs more thought — reverted

### What Would Close the Gap Most
1. **Floor color** — shift from blue-gray to mint-green (trivial, biggest impact)
2. **Desk tile** — adding a CRT monitor + keyboard to the 32px desk texture (medium effort, high impact since desks are everywhere)
3. **Wall depth** — baseboard strip at bottom of wall tiles (easy, adds a lot of dimension)
4. **Room layout** — the mockup has cubicle rows with multiple desks, not just a few scattered objects. This is a data change in Supabase (room tilemap + object placements), not code
5. **Plants** — taller, more detailed potted plants (procedural improvement)

### Things Working Well
- Glitchy "?" fallback textures look great in both Phaser and React inventory
- Interaction system is solid (FK-based cache + AI fallback + output item persistence)
- Mr. Jacobs face moods + speech panel working
- Player movement and depth sorting correct
- State indicators (lock, power, etc.) read well at small scale

### Technical Decisions Made This Session
- Interactions keyed by item_id + object_id (NOT tags) — tags are AI context only
- Output items get upserted into items table with real UUIDs
- Inventory fallback uses inline SVG data URL matching the Phaser procedural texture
