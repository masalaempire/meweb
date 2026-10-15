import type { ArchiveController, ArchiveEntry, ArchiveOptions, ArchiveSectionId } from '../types';
import './archive.css';

type Route = { section: ArchiveSectionId; entry?: string };

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Reject executable and unexpected URL schemes even when content is supplied externally.
function safeHref(value: string, media = false): string | undefined {
  try {
    const url = new URL(value, document.baseURI);
    return (media ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:']).includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function createArchive({ content, onExit }: ArchiveOptions): ArchiveController {
  const listeners = new AbortController();
  const root = element('div', 'archive-screen');
  root.setAttribute('aria-label', `${content.owner.handle || content.owner.name} archive`);
  root.tabIndex = -1;
  const header = element('header', 'archive-header');
  const identity = element('div', 'archive-identity');
  identity.append(element('span', 'archive-owner', content.owner.handle || content.owner.name), element('span', 'archive-identity-divider', '/'), element('span', 'archive-name', 'Archive'));
  const exit = element('button', 'archive-exit', 'Return to room');
  exit.type = 'button';
  const exitAction = () => onExit();
  exit.addEventListener('click', exitAction, { signal: listeners.signal });
  header.append(identity, exit);

  const layout = element('div', 'archive-layout');
  const sidebar = element('aside', 'archive-sidebar');
  const nav = element('nav', 'archive-nav');
  nav.setAttribute('aria-label', 'Archive sections');
  const navLabel = element('p', 'archive-eyebrow', 'Browse');
  nav.append(navLabel);
  const navList = element('ul', 'archive-nav-list');
  const navButtons = new Map<ArchiveSectionId, HTMLButtonElement>();
  for (const section of content.sections) {
    const item = element('li');
    const button = element('button', 'archive-section-button');
    button.type = 'button';
    button.append(element('span', 'archive-section-label', section.title));
    const count = content.entries.filter(entry => entry.section === section.id).length;
    const countLabel = element('span', 'archive-section-count', String(count).padStart(2, '0'));
    countLabel.setAttribute('aria-hidden', 'true');
    button.append(countLabel);
    button.addEventListener('click', () => {
      scrollPositions.set(section.id, 0);
      if (route.section === section.id && !route.entry) {
        main.scrollTop = 0;
        focusTarget?.focus({ preventScroll: true });
        return;
      }
      select({ section: section.id }, true);
    }, { signal: listeners.signal });
    navButtons.set(section.id, button);
    item.append(button);
    navList.append(item);
  }
  nav.append(navList);
  const about = element('div', 'archive-sidebar-about');
  if (content.owner.description) about.append(element('p', 'archive-owner-description', content.owner.description));
  const contact = element('div', 'archive-contact');
  contact.setAttribute('aria-label', 'Contact and links');
  if (content.contact.email) appendLink(contact, 'Email', `mailto:${content.contact.email}`);
  for (const link of content.contact.links) appendLink(contact, link.label, link.href);
  about.append(contact);
  sidebar.append(nav, about);

  const main = element('main', 'archive-main');
  main.setAttribute('aria-label', 'Archive content');
  main.tabIndex = -1;
  layout.append(sidebar, main);
  root.append(header, layout);

  let active = false;
  let disposed = false;
  let route: Route = defaultRoute();
  let hasRendered = false;
  let focusTarget: HTMLElement | null = null;
  let lastFocused: HTMLElement | null = null;
  let lastOpenedEntry: string | undefined;
  let renderListeners = new AbortController();
  const scrollPositions = new Map<ArchiveSectionId, number>();
  const rowButtons = new Map<string, HTMLButtonElement>();

  function appendLink(parent: HTMLElement, label: string, href: string) {
    const safe = safeHref(href);
    if (!safe) return;
    const link = element('a', 'archive-link', label);
    link.href = safe;
    if (new URL(safe).protocol !== 'mailto:') {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    parent.append(link);
  }

  function defaultRoute(): Route {
    return { section: content.sections.find(section => section.id === 'projects')?.id ?? content.sections[0]?.id ?? 'projects' };
  }

  function parse(hash: string): Route {
    let parts: string[];
    try {
      parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    } catch {
      return defaultRoute();
    }
    if (parts.length === 0 || parts.length > 2) return defaultRoute();
    const section = content.sections.find(item => item.id === parts[0]);
    if (section) {
      if (!parts[1]) return { section: section.id };
      const entry = content.entries.find(item => item.section === section.id && item.id === parts[1]);
      return entry ? { section: section.id, entry: entry.id } : defaultRoute();
    }
    // Earlier links used project IDs directly, such as #ontimely.
    const legacyEntry = parts.length === 1 && content.entries.find(item => item.section === 'projects' && item.id === parts[0]);
    return legacyEntry ? { section: 'projects', entry: legacyEntry.id } : defaultRoute();
  }

  function hashFor(next: Route): string {
    return `#/${next.section}${next.entry ? `/${encodeURIComponent(next.entry)}` : ''}`;
  }

  function select(next: Route, writeHash: boolean) {
    if (disposed) return;
    if (hasRendered && route.section === next.section && route.entry === next.entry) return;
    if (hasRendered && !route.entry) scrollPositions.set(route.section, main.scrollTop);
    const previous = route;
    route = next;
    if (writeHash && window.location.hash !== hashFor(next)) window.location.hash = hashFor(next);
    render(previous);
  }

  function render(previous: Route) {
    renderListeners.abort();
    renderListeners = new AbortController();
    main.replaceChildren();
    rowButtons.clear();
    lastFocused = null;
    for (const [id, button] of navButtons) {
      if (id === route.section) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    const section = content.sections.find(item => item.id === route.section);
    const entry = content.entries.find(item => item.section === route.section && item.id === route.entry);
    if (entry) renderEntry(entry, section?.title ?? 'Projects');
    else renderIndex(section?.title ?? 'Projects', section?.description ?? '');
    hasRendered = true;
    if (entry) {
      main.scrollTop = 0;
    } else {
      main.scrollTop = scrollPositions.get(route.section) ?? 0;
      if (previous.entry && previous.section === route.section) {
        const row = rowButtons.get(previous.entry);
        if (row) focusTarget = row;
      }
    }
    if (active) focusTarget?.focus({ preventScroll: true });
  }

  function renderIndex(title: string, description: string) {
    const heading = element('div', 'archive-section-heading');
    const eyebrow = element('p', 'archive-eyebrow', 'Personal archive');
    const h1 = element('h1', 'archive-title', title);
    h1.tabIndex = -1;
    focusTarget = h1;
    heading.append(eyebrow, h1);
    if (description) heading.append(element('p', 'archive-description', description));
    main.append(heading);
    const entries = content.entries.filter(entry => entry.section === route.section);
    const listHeader = element('div', 'archive-list-header');
    listHeader.append(element('span', '', 'Entries'), element('span', 'archive-meta', `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`));
    main.append(listHeader);
    if (entries.length === 0) {
      const empty = element('div', 'archive-empty');
      empty.append(element('h2', '', 'Nothing filed here yet.'), element('p', '', 'This section is waiting for content.'));
      main.append(empty);
      return;
    }
    const list = element('ul', 'archive-entry-list');
    for (const entry of entries) {
      const item = element('li', 'archive-entry-item');
      const button = element('button', 'archive-entry-row');
      button.type = 'button';
      const copy = element('span', 'archive-entry-copy');
      copy.append(element('span', 'archive-entry-title', entry.title));
      if (entry.summary) copy.append(element('span', 'archive-entry-summary', entry.summary));
      const metadata = element('span', 'archive-entry-metadata');
      metadata.append(element('span', 'archive-entry-kind', entry.kind));
      if (entry.status === 'needs-content') metadata.append(element('span', 'archive-content-status', 'Content needed'));
      const arrow = element('span', 'archive-entry-arrow', '→');
      arrow.setAttribute('aria-hidden', 'true');
      button.append(copy, metadata, arrow);
      button.addEventListener('click', () => {
        lastOpenedEntry = entry.id;
        select({ section: entry.section, entry: entry.id }, true);
      }, { signal: renderListeners.signal });
      if (lastOpenedEntry === entry.id) button.dataset.lastOpened = 'true';
      rowButtons.set(entry.id, button);
      item.append(button);
      list.append(item);
    }
    main.append(list);
  }

  function renderEntry(entry: ArchiveEntry, sectionTitle: string) {
    const article = element('article', 'archive-article');
    const breadcrumb = element('nav', 'archive-breadcrumb');
    breadcrumb.setAttribute('aria-label', 'Breadcrumb');
    const back = element('button', 'archive-back', `← ${sectionTitle}`);
    back.type = 'button';
    back.addEventListener('click', () => select({ section: entry.section }, true), { signal: renderListeners.signal });
    breadcrumb.append(back);
    const head = element('header', 'archive-detail-heading');
    head.append(element('p', 'archive-eyebrow', entry.kind));
    const title = element('h1', 'archive-detail-title', entry.title);
    title.tabIndex = -1;
    focusTarget = title;
    head.append(title);
    if (entry.summary) head.append(element('p', 'archive-detail-summary', entry.summary));
    if (entry.status === 'needs-content') head.append(element('p', 'archive-content-notice', 'Content needed — this entry is still waiting for material.'));
    article.append(breadcrumb, head);
    const body = element('div', 'archive-body');
    for (const block of entry.body) {
      if (block.type === 'text') {
        for (const paragraph of block.paragraphs) body.append(element('p', '', paragraph));
      } else if (block.type === 'image') {
        const source = safeHref(block.src, true);
        if (!source) continue;
        const figure = element('figure', 'archive-figure');
        const image = element('img');
        image.src = source;
        image.alt = block.alt;
        image.loading = 'lazy';
        image.decoding = 'async';
        if (block.width && block.width > 0) image.width = block.width;
        if (block.height && block.height > 0) image.height = block.height;
        figure.append(image);
        if (block.caption) figure.append(element('figcaption', '', block.caption));
        body.append(figure);
      } else if (block.type === 'video') {
        const source = safeHref(block.src, true);
        if (!source) continue;
        const figure = element('figure', 'archive-figure');
        const video = element('video');
        video.src = source;
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        const poster = block.poster && safeHref(block.poster, true);
        if (poster) video.poster = poster;
        figure.append(video);
        if (block.caption) figure.append(element('figcaption', '', block.caption));
        body.append(figure);
      } else if (block.type === 'link') {
        const paragraph = element('p', 'archive-body-link');
        appendLink(paragraph, block.label, block.href);
        if (paragraph.childElementCount) body.append(paragraph);
      }
    }
    if (!entry.body.length && entry.status !== 'needs-content') body.append(element('p', 'archive-content-notice', 'More material has not been added to this entry yet.'));
    article.append(body);
    main.append(article);
  }

  function onHashChange() {
    select(parse(window.location.hash), false);
  }
  window.addEventListener('hashchange', onHashChange, { signal: listeners.signal });
  select(parse(window.location.hash), false);
  root.inert = true;
  root.setAttribute('aria-hidden', 'true');
  root.dataset.active = 'false';

  return {
    element: root,
    navigate(hash) {
      select(parse(hash), false);
    },
    setActive(value) {
      if (disposed || active === value) return;
      if (!value) {
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && root.contains(focused)) {
          lastFocused = focused;
          focused.blur();
        }
      }
      active = value;
      root.inert = !value;
      root.dataset.active = String(value);
      if (value) {
        root.removeAttribute('aria-hidden');
        const target = lastFocused && root.contains(lastFocused) ? lastFocused : focusTarget;
        target?.focus({ preventScroll: true });
      } else {
        main.querySelectorAll('video').forEach(video => video.pause());
        root.setAttribute('aria-hidden', 'true');
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.abort();
      renderListeners.abort();
      root.inert = true;
      main.querySelectorAll('video').forEach(video => video.pause());
      root.remove();
    },
  };
}
