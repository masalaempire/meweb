import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { archiveContent } from '../app/src/content/index.ts';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('docs/legacy-manifest.json', root), 'utf8'));
let checkedLinks = 0;
for (const { path, sha } of manifest) {
  for (const prefix of ['', 'dist/']) {
    const data = await readFile(new URL(prefix + path, root));
    const digest = createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
    assert.equal(digest, sha, `Legacy content changed: ${prefix}${path}`);
    if (path.endsWith('.html')) {
      const page = new URL(prefix + path, root);
      for (const match of data.toString().matchAll(/(?:href|src)="([^"]+)"/g)) {
        const value = match[1].replaceAll('&amp;', '&');
        if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) continue;
        const local = value.startsWith('/') ? new URL(prefix + value.slice(1), root) : new URL(value, page);
        local.hash = ''; local.search = '';
        await access(local);
        checkedLinks++;
      }
    }
  }
}
const projects = JSON.parse(await readFile(new URL('projects.json', root), 'utf8'));
assert.equal(projects.length, 7, 'Expected the seven supplied projects');
assert.equal(new Set(projects.map(project => project.slug)).size, projects.length, 'Duplicate project IDs');
for (const project of projects) {
  for (const field of ['slug', 'name', 'category', 'description', 'url']) assert.ok(project[field], `Missing ${project.slug}.${field}`);
  assert.ok(['http:', 'https:'].includes(new URL(project.url).protocol), `Invalid project URL: ${project.slug}`);
  if (project.featured) {
    assert.ok(project.alt && project.width > 0 && project.height > 0 && project.paragraphs?.length, `Incomplete featured project: ${project.slug}`);
  }
  for (const path of [project.image, project.secondImage].filter(Boolean)) {
    for (const prefix of ['', 'dist/']) await access(new URL(prefix + path, root));
  }
}
assert.deepEqual(archiveContent.entries.filter(entry => entry.section === 'projects').map(entry => entry.id), projects.map(project => project.slug), 'Archive project order differs from supplied data');
assert.equal(new Set(archiveContent.entries.map(entry => entry.id)).size, archiveContent.entries.length, 'Duplicate archive entry IDs');
assert.deepEqual(archiveContent.sections.map(section => section.id), ['projects', 'interests', 'life', 'experiments']);
assert.equal(archiveContent.entries.filter(entry => entry.section === 'interests').length, 4, 'Expected four factual interests');
assert.deepEqual(archiveContent.entries.filter(entry => entry.status === 'needs-content').map(entry => entry.id), ['personal-memories', 'unfinished-work']);
for (const project of projects) {
  const entry = archiveContent.entries.find(entry => entry.section === 'projects' && entry.id === project.slug);
  assert.equal(entry.title, project.name);
  assert.equal(entry.summary, project.description);
  const paragraphs = entry.body.filter(block => block.type === 'text').flatMap(block => block.paragraphs);
  if (project.intro) assert.deepEqual(paragraphs, [project.intro, ...project.paragraphs], `Lost project text: ${project.slug}`);
  assert.deepEqual(entry.body.filter(block => block.type === 'image').map(block => block.src), [project.image, project.secondImage].filter(Boolean).map(path => '/' + path), `Lost project media: ${project.slug}`);
}
const home = await readFile(new URL('index.html', root));
assert.deepEqual(home, await readFile(new URL('dist/index.html', root)), 'Root homepage differs from dist');
const html = home.toString();
for (const asset of html.matchAll(/(?:src|href)="(\/archive-assets\/[^"]+)"/g)) await access(new URL(asset[1].slice(1), root));
for (const file of await readdir(new URL('dist/archive-assets/', root))) {
  assert.deepEqual(await readFile(new URL('archive-assets/' + file, root)), await readFile(new URL('dist/archive-assets/' + file, root)), `Generated asset differs: ${file}`);
}
console.log(`Checked ${manifest.length} preserved legacy files, ${checkedLinks} local URL references, ${projects.length} projects, ${archiveContent.entries.length} archive entries, generated homepage, and build assets.`);
