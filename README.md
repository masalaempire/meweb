# SimonLM

A desktop room with a working HTML archive inside its monitor. Move the pointer to look around, click the monitor or **Use computer**, and browse with the mouse or keyboard. **Return to room** and Escape leave the computer. The **Reduce motion** control disables head movement and camera travel; it follows the system preference initially and when that preference changes.

The source app is Vite, TypeScript, and Three.js. The monitor contains ordinary HTML rendered at a fixed logical size through CSS3D; browsing and scrolling happen inside that screen. Narrow or touch-only displays receive a desktop notice with a link to the existing project index. If WebGL cannot initialize, the archive opens directly.

## Work locally

Use the tested Node.js 24.19.0 runtime pinned in `.node-version`, with npm. The application supports Node.js 22.22.2 or later, or Node.js 24.15.0 or later.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Dependencies are pinned in `package-lock.json`. `dev` prepares ignored copies of legacy images in `public/`. `build` prepares the same assets, checks TypeScript, builds `dist/`, copies unchanged legacy pages and media, and synchronizes the generated homepage and `archive-assets/` back to the repository root. The root and `dist/` are both deployable. Commit the generated root files with source changes.

## Hosting and legacy URLs

Keep the existing Cloudflare Pages configuration serving the repository root. No production build-setting change is required. The committed `index.html` is generated; edit `app/index.html` or `app/src/` instead. No alternate hosting service is used.

Existing `projects.html`, `about.html`, `contact.html`, `projects/*.html`, `styles.css`, and `assets/` remain intact. `projects.json` remains the factual project source. The former static homepage generator has been replaced by the application build entry point at `scripts/build.mjs`; running it cannot regenerate the old homepage.

## Source boundaries

- `app/src/main.ts` handles mode changes, keyboard focus, preferences, and startup fallback.
- `app/src/scene/` owns the room, physical monitor, CSS3D mounting, and camera.
- `app/src/archive/` owns archive navigation, entry reading, media, and internal scrolling.
- `app/src/content/` turns factual source material into archive entries.
- `app/src/types.ts` defines their shared contracts.

`npm run check` compares legacy file bytes with the approved main snapshot using Git blob hashes and checks generated root/dist parity. It requires an existing build. This structural check does not replace browser review of camera transitions, text clarity, keyboard operation, or scroll behavior. See `docs/review.md`.
