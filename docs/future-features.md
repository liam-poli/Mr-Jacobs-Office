# Future Features

## Img2Img Directional Sprite Generation

**Problem:** Currently each directional sprite (up/down/left/right) is generated independently via text-to-image. This means the 4 views of the same object can look inconsistent — different colors, proportions, details.

**Proposed Solution:** Use Flux 2 Pro's `image_prompt` parameter to do image-conditioned generation.

### Pipeline

1. **Generate isometric reference** — A single 3/4-angle image of the object that captures its full 3D form, colors, and proportions. This image is NOT used in-game, only as a reference.
2. **Generate 4 flat views** — Use the isometric reference as `image_prompt` with `image_prompt_strength` alongside direction-specific text prompts (front, back, left, right). The reference guides consistency.
3. **Remove backgrounds** — Run all 4 through rembg as usual.
4. **Save to `directional_sprites`** — Store all 4 in the JSONB column.

### Why Isometric Reference?

- An angled view shows depth, volume, and details from all sides
- Generating a flat front view and using it for the other 3 loses information (the front doesn't show what the back looks like)
- The isometric reference captures color palette, materials, and proportions that carry through to all 4 views

### Implementation

- Add `image_prompt` + `image_prompt_strength` support to `replicate.ts`
- Add isometric prompt builder to `generate-sprite/index.ts`
- New endpoint or mode: `generate-all-directions` that runs the full 5-step pipeline (1 reference + 4 guided views)
- "Generate All Directions" button in admin ObjectsTab
- Cost: 5 generations instead of 4, but much better consistency

### Replicate API

Flux 2 Pro accepts:
- `image_prompt`: URL of the reference image
- `image_prompt_strength`: 0.0–1.0 controlling how much the reference influences output

### Prompt Structure

**Isometric reference:**
```
A single {name}, 3/4 isometric view, slightly elevated angle showing front and side,
pixel art sprite, 16-bit retro game style, crisp 1-pixel edges, no blur,
natural colors, warm muted tones, 1980s office aesthetic,
centered on a plain white background, no shadows, no text.
Properties: {tags}.
```

**Directional views (with image_prompt):**
```
A single {name}, 2D pixel art sprite for a retro 16-bit top-down video game,
flat orthographic {direction_hint}, perfectly straight-on, zero perspective,
crisp 1-pixel edges, same colors and style as reference,
centered on a plain white background, no shadows, no text.
```
