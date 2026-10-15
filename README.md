# Simon Qian’s portfolio

A static portfolio. The homepage is the project gallery; the index lists all work. About and Contact are deliberately short. Featured projects have their own pages.

## Hosting

Serve the repository root. No installation, build step, external fonts, or browser JavaScript is required. Existing `index.html`, `projects.html`, `about.html`, and `contact.html` URLs remain available.

## Editing projects

Project content lives in `projects.json`. The order in that file controls the gallery and index.

1. Add or edit an entry with a unique lowercase `slug`, `name`, `category`, `description`, `status`, and `url`.
2. Use `"status": "in-progress"` for upcoming work. A non-featured entry can omit its URL until it has something to visit; it renders as text rather than a dead link.
3. To feature a project, add `"featured": true`, an image in `assets/`, descriptive `alt` text, its natural `width` and `height`, and project-page content (`intro`, `paragraphs`, `caption`, `action`). Optional fields: `source`, `secondImage`, `secondAlt`, `secondCaption`.
4. Run `node scripts/build.mjs` with Node.js 18 or later and commit the generated HTML along with the content changes.

The generator resolves paths relative to itself, so it works from any directory. It uses only Node built-ins. To remove a featured project completely, also delete its old HTML file under `projects/`; regeneration does not delete files.

## Design and images

Layout and responsive rules are in `styles.css`. The first three projects have individually arranged image sizes; additional featured projects use a full-width layout by default.

The project screenshots are existing repository assets, copied without modifying their image content. Images retain their original proportions. The site uses system sans-serif fonts, visible keyboard focus, a skip link, semantic landmarks, and reduced-motion support.
