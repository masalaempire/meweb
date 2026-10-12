import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// HTML is committed alongside its source. Hosting needs no runtime or build step.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projects = JSON.parse(await readFile(resolve(root, 'projects.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const arrow = '<span class="project-arrow" aria-hidden="true">↗</span>';
const external = (url, text, className = '') => `<a class="${className}" href="${escape(url)}"${url.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener noreferrer"'}>${escape(text)} ${arrow}</a>`;
const seen = new Set();
for (const project of projects) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) || seen.has(project.slug)) throw new Error('Project slugs must be unique and URL-safe.');
  seen.add(project.slug);
  if (!['published', 'in-progress'].includes(project.status)) throw new Error(`Invalid status for ${project.slug}`);
  for (const key of ['url', 'source']) if (project[key] && !project[key].startsWith('https://')) throw new Error(`Use an HTTPS ${key} for ${project.slug}`);
  if (project.featured && (!project.image || !project.details?.length)) throw new Error(`Featured project ${project.slug} needs an image and details.`);
}
const featured = projects.filter(project => project.featured && project.status === 'published');
const other = projects.filter(project => !project.featured && project.status === 'published');
const ongoing = projects.filter(project => project.status === 'in-progress');
const count = value => String(value).padStart(2, '0');
const detailUrl = (project, prefix = '') => `${prefix}projects/${project.slug}.html`;

function layout({title, description, content, active = 'projects', prefix = '', mainClass = ''}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="theme-color" content="#f6f4ed">
  <link rel="icon" href="${prefix}favicon.ico">
  <link rel="stylesheet" href="${prefix}styles.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="wrap">
    <header class="site-header">
      <a class="identity" href="${prefix}index.html" aria-label="Simon Qian home"><strong>Simon Qian</strong><span>SimonLM</span></a>
      <nav class="site-nav" aria-label="Main navigation">
        <a href="${prefix}projects.html"${active === 'projects' ? ' aria-current="page"' : ''}>Projects</a>
        <a href="${prefix}about.html"${active === 'about' ? ' aria-current="page"' : ''}>About</a>
        <a href="${prefix}contact.html"${active === 'contact' ? ' aria-current="page"' : ''}>Contact</a>
      </nav>
    </header>
    <main id="main" class="${mainClass}" tabindex="-1">
${content}
    </main>
    <footer class="site-footer">
      <p>© 2026 Simon Qian / SimonLM</p>
      <div class="footer-links">${external('mailto:simonlm@simonlm.one', 'Email')}${external('https://github.com/masalaempire', 'GitHub')}<a href="${prefix}contact.html">Elsewhere</a></div>
    </footer>
  </div>
</body>
</html>
`;
}
function projectImage(project, prefix = '', eager = false) {
  return `<div class="project-image ${escape(project.slug)}"><img src="${prefix}${escape(project.image)}" alt="${escape(project.alt)}" width="${project.width}" height="${project.height}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></div>`;
}
function featuredProject(project, index) {
  return `      <article class="featured-project">
        <a class="project-image-link" href="${detailUrl(project)}" aria-label="View ${escape(project.name)} project">${projectImage(project, '', index === 0)}</a>
        <div class="project-summary">
          <div class="label">${count(index + 1)} / ${escape(project.category)}</div>
          <h3><a href="${detailUrl(project)}">${escape(project.name)}</a></h3>
          <p>${escape(project.description)}</p>
          <div class="project-links"><a class="primary-link" href="${detailUrl(project)}">View project <span aria-hidden="true">→</span></a>${external(project.url, project.action)}</div>
        </div>
      </article>`;
}
function projectRow(project, index) {
  const hasDetail = project.featured && project.status === 'published';
  const href = hasDetail ? detailUrl(project) : project.url;
  const link = href ? `href="${escape(href)}"${hasDetail ? '' : ' target="_blank" rel="noopener noreferrer"'}` : '';
  const tag = href ? 'a' : 'div';
  return `      <${tag} class="project-row" ${link}>
        <span class="row-number">${count(index + 1)}</span>
        <span class="row-name">${escape(project.name)}${project.status === 'in-progress' ? '<span class="row-status">In progress</span>' : ''}</span>
        <span class="row-description">${escape(project.description)}</span>
        <span class="row-category">${escape(project.category)}</span>
        <span class="row-arrow" aria-hidden="true">${href ? (hasDetail ? '→' : '↗') : '—'}</span>
      </${tag}>`;
}
function ongoingSection() {
  return ongoing.length ? `    <section class="index-section" aria-labelledby="ongoing-title">
      <div class="section-heading"><h2 id="ongoing-title">In progress</h2><span class="label muted">${count(ongoing.length)}</span></div>
      <div class="project-list">${ongoing.map(projectRow).join('\n')}</div>
    </section>` : `    <div class="ongoing"><span class="label muted">Ongoing work</span>${external('https://github.com/masalaempire', 'Follow new projects on GitHub')}</div>`;
}

const home = layout({
  title: 'Simon Qian / SimonLM',
  description: 'Simon Qian (SimonLM), a student interested in computer science and design. Explore my apps, websites, and games.',
  active: 'home', mainClass: 'home-main',
  content: `    <header class="home-intro">
      <h1>Hi, I’m<br><em>Simon.</em></h1>
      <div class="home-copy"><p>I’m a student interested in computer science and design. I make apps, websites, and games.</p><p>I also play piano, listen to records, and play space games.</p><a class="home-project-link" href="projects.html">Explore my projects <span aria-hidden="true">→</span></a></div>
    </header>
    <div class="home-projects"><span class="label muted">Some recent work</span><div>${featured.map((project, index) => `<a href="${detailUrl(project)}"><span class="label muted">${count(index + 1)}</span>${escape(project.name)} <span aria-hidden="true">↗</span></a>`).join('')}</div></div>`
});

const projectIndex = layout({
  title: 'Projects — Simon Qian',
  description: 'Apps, websites, games, and experiments by Simon Qian. Explore HowLong, MinEDHelper, OnTimely, and more.',
  content: `    <header class="intro">
      <h1>Selected<br><em>work.</em></h1>
      <div class="intro-copy"><span class="label">Projects / ${count(featured.length + other.length)}</span><p>Apps, websites, games, and a few experiments.</p></div>
    </header>
    <section aria-labelledby="selected-title">
      <div class="section-heading"><h2 id="selected-title">Selected projects</h2><span class="label muted">${count(featured.length)} projects</span></div>
      <div class="featured-grid">
${featured.map(featuredProject).join('\n')}
      </div>
    </section>
    <section class="index-section" aria-labelledby="more-title">
      <div class="section-heading"><h2 id="more-title">More projects</h2><span class="label muted">${count(other.length)} projects</span></div>
      <div class="project-list">
${other.map((project, index) => projectRow(project, featured.length + index)).join('\n')}
      </div>
    </section>
${ongoingSection()}
    <a class="back-link index-back" href="index.html">← Back to Simon</a>`
});

const about = layout({
  title: 'About — Simon Qian', active: 'about', mainClass: 'small-main',
  description: 'A little about Simon Qian: programming, piano, games, and making things.',
  content: `    <header class="page-intro"><h1>Hi, I’m Simon.</h1></header>
    <div class="bio"><p>I’m a student interested in computer science and design. I build small apps, websites, and games, and do competitive programming in C++ on Luogu and USACO.</p><p>Outside of code, I play piano, listen to Ed Sheeran on vinyl, and spend time in Elite Dangerous, Derail Valley, and Minecraft.</p></div>
    <p class="pronouns">Simon Qian online as SimonLM. He/they is a good default.</p>
    <a class="back-link" href="projects.html">Explore my projects →</a>`
});

const contacts = [
  ['Email', 'simonlm@simonlm.one', 'mailto:simonlm@simonlm.one'],
  ['GitHub', '@masalaempire', 'https://github.com/masalaempire'],
  ['YouTube', '@SimonLMLD', 'https://www.youtube.com/@SimonLMLD'],
  ['Instagram', '@simonlm0608', 'https://www.instagram.com/simonlm0608'],
  ['X / Twitter', '@laomengsi', 'https://x.com/laomengsi'],
  ['Reddit', 'u/SimonLMLD', 'https://www.reddit.com/user/SimonLMLD/'],
  ['Inara', 'CMDR SimonLM', 'https://simonlm.space']
];
const contact = layout({
  title: 'Contact — Simon Qian', active: 'contact', mainClass: 'small-main',
  description: 'Email and other places to find Simon Qian (SimonLM).',
  content: `    <header class="page-intro"><h1>Find me here.</h1></header>
    <div class="contact-list">${contacts.map(([name, handle, url]) => `<a class="contact-row" href="${escape(url)}"${url.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener noreferrer"'}><span>${escape(name)}</span><span>${escape(handle)} ${arrow}</span></a>`).join('\n')}</div>
    <a class="back-link" href="projects.html">← Back to the projects</a>`
});

await mkdir(resolve(root, 'projects'), {recursive: true});
for (const [name, content] of Object.entries({'index.html':home, 'projects.html':projectIndex, 'about.html':about, 'contact.html':contact})) await writeFile(resolve(root, name), content);
for (const [index, project] of featured.entries()) {
  const next = featured[(index + 1) % featured.length];
  const content = `    <a class="back-link" href="../projects.html">← Selected work</a>
    <header class="detail-intro">
      <div><div class="detail-meta label"><span>${escape(project.category)}</span><span>Published</span></div><h1>${escape(project.name)}</h1></div>
      <div><p>${escape(project.description)}</p><div class="project-links">${external(project.url, project.action, 'primary-link')}${project.source ? external(project.source, 'Source on GitHub') : ''}</div></div>
    </header>
    <figure class="detail-figure">${projectImage(project, '../', true)}<figcaption>${escape(project.caption)}</figcaption></figure>
    <div class="detail-copy">${project.details.map(detail => `<section><h2>${escape(detail.title)}</h2><p>${escape(detail.text)}</p></section>`).join('\n')}</div>
    ${project.secondImage ? `<figure class="detail-figure"><div class="project-image ${escape(project.slug)}"><img src="../${escape(project.secondImage)}" alt="${escape(project.secondAlt)}" width="1500" height="983" loading="lazy" decoding="async"></div><figcaption>${escape(project.secondCaption)}</figcaption></figure>` : ''}
    <div class="detail-next"><a href="../projects.html">All projects</a><a href="${next.slug}.html">Next: ${escape(next.name)} <span aria-hidden="true">→</span></a></div>`;
  await writeFile(resolve(root, 'projects', `${project.slug}.html`), layout({title:`${project.name} — Simon Qian`, description: project.description, prefix: '../', content}));
}
console.log(`Generated four pages and ${featured.length} project pages.`);
