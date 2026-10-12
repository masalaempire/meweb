# Simon Qian / SimonLM

A static portfolio. The landing page introduces Simon and links into the work. The Projects page leads with OnTimely, MinEDHelper, and HowLong, and keeps all seven published projects. About and Contact stay small.

## Editing projects

`projects.json` is the source for the homepage's recent links, the Projects page, and featured project pages. Edit it, then run:

```sh
node scripts/build.mjs
```

Commit the generated HTML along with the source. The existing host can serve the repository root directly, without a build step, dependencies, or client-side JavaScript. Open `index.html` directly, or use any static server to preview it.

To add a project, copy an existing entry and give it a unique `slug`. Set `status` to `published` or `in-progress`. An in-progress entry appears under **In progress** on the Projects page; omit its `url` if there is nothing public to open yet. No upcoming projects are named until there is real content to show.

Set `featured` to `true` for a published project that should appear in the visual gallery. Provide its image, accessible `alt` text, intrinsic dimensions, caption, and short `details`. That also generates `projects/<slug>.html`. Images live in `assets/`. Remove an old generated project page manually if retiring or renaming a featured entry.

About and Contact content, page markup, and shared navigation are in `scripts/build.mjs`. Shared presentation is in `styles.css`. The existing `/about.html`, `/contact.html`, and `/projects.html` URLs remain available.

## Image sources

- `assets/howlong.png`: the user's uploaded HowLong screenshot, `Screenshot 2026-10-12 at 16.55.34.png`, showing the Space Shuttle practice question. Preserved without cropping or image edits.
- `assets/minedhelper.png`: the user's uploaded MinEDHelper screenshot, `Screenshot 2026-10-12 at 16.55.03.png`, showing the Tools page. Preserved without cropping or image edits.
- `assets/ontimely.webp` and `assets/ontimely-plan.webp`: optimized copies of the existing app screenshots at https://ontimely.simonlm.one/assets/screenshots/inbox.png and https://ontimely.simonlm.one/assets/screenshots/review-plan.png.

Product descriptions are based on the existing portfolio, the live interfaces, and the OnTimely and WebEDHelper repository READMEs. The pages make no claims about user counts, awards, or a development process.
