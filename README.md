# Nimbus

A spacious cloud-storage interface built with Next.js, React, TypeScript, and custom CSS. Frontend only: no backend, authentication, database service, or cloud integrations.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## UI

- Responsive workspace, pastel folders, original cloud illustration, and visual file cards
- Grid/list views, search, file-type filters, sorting, starred files, and shared/trash views
- File previews, new-folder and rename dialogs, contextual menus, drag-and-drop feedback, and toast notifications
- Keyboard shortcuts, visible focus states, modal focus management, and reduced-motion support
- Local demo uploads using browser IndexedDB; folder and file metadata using localStorage

The storage usage and collaborators are illustrative. Sharing is presented as a frontend dialog. Uploaded files stay on the current browser and device.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Structure

- `src/components/workspace.tsx`: interactive workspace and dialogs
- `src/components/icons.tsx`: lightweight custom SVG icons
- `src/app/globals.css`: visual system and responsive layouts
- `src/lib/library.ts`: sample content and local browser file helpers
- `public/previews/`: original artwork and sample files
- `public/fonts/`: locally served Manrope fonts

## Assets

The cloud illustration, brand artwork, website mockup, document and notebook previews are original SVGs. Landscape photos are from [Unsplash](https://unsplash.com): [ocean](https://images.unsplash.com/photo-1518837695005-2083093ee35b) and [mountains](https://images.unsplash.com/photo-1470770841072-f978cf4d019e). Typography uses [Manrope](https://github.com/sharanda/manrope), licensed under the SIL Open Font License.
