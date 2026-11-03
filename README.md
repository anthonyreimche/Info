# Info for Safelight

The Library **Info** panel: what you need to know about the selected photo,
right of the grid.

- **Histogram:** the photo's tones with its saved edit applied, so it
  matches what Develop shows. It updates as you edit, in any window.
- **Keywords:** the photo's keywords as chips. Type a keyword and press
  Enter or a comma to add it; suggestions from the rest of the catalog
  appear as you type (arrow keys to pick one). Click × on a chip, or press
  Backspace in the empty field, to remove one. With several photos
  selected, the chips are the keywords they all share, and adding or
  removing applies to every one. Press K in the Library to jump to the
  field.
- **Metadata:** the rating, then the camera, lens, exposure, date,
  location and file details the photo carries. Empty fields are left out.

Until Safelight 3.2.0 this panel was built in. It keeps the built-in panel's
id (`core.info`), so layouts saved before then keep it where it was.

## Development

```bash
npm install
npm run typecheck
npm run build    # dist/index.js, the file Safelight loads
npm test         # vitest; the bundle checks read dist/, so build first
npm run check    # all three, in that order
```

Safelight hands the extension its own React through `api.react`, so the
bundle never includes React. `src/safelight.d.ts` mirrors the part of the
app's extension API the extension uses.

## Licence

GPL-3.0-only with an attribution term (GPL v3 §7b), the same licence as Safelight; see LICENSE. Copyright (C) 2026 Anthony Reimche.
