import projects from '../../../projects.json' with { type: 'json' };
import type { ArchiveBodyBlock, ArchiveContent, ArchiveEntry } from '../types';

function projectEntry(project: typeof projects[number]): ArchiveEntry {
  const body: ArchiveBodyBlock[] = [];
  if (project.intro) body.push({ type: 'text', paragraphs: [project.intro, ...(project.paragraphs ?? [])] });
  if (project.image && project.alt) body.push({
    type: 'image', src: '/' + project.image, alt: project.alt,
    caption: project.caption, width: project.width, height: project.height,
  });
  if (project.secondImage && project.secondAlt) body.push({
    type: 'image', src: '/' + project.secondImage, alt: project.secondAlt, caption: project.secondCaption,
  });
  body.push({ type: 'link', label: project.action ?? 'Visit project', href: project.url });
  if (project.source) body.push({ type: 'link', label: 'Source on GitHub', href: project.source });
  return {
    id: project.slug, section: 'projects', title: project.name, kind: project.category,
    summary: project.description, status: 'available', body, source: `projects.json: ${project.slug}`,
  };
}

const community = projects.find(project => project.slug === 'masala-empire')!;
const experiment = projects.find(project => project.slug === 'somnasculpt')!;

export const archiveContent: ArchiveContent = {
  owner: { name: 'Simon', handle: 'SimonLM', description: 'Student. Apps, websites & games.' },
  contact: {
    email: 'simonlm@simonlm.one',
    links: [{ label: 'GitHub', href: 'https://github.com/masalaempire' }],
  },
  sections: [
    { id: 'projects', title: 'Projects', description: 'Apps, websites, games and other published work.' },
    { id: 'interests', title: 'Interests', description: 'Programming, music, Elite Dangerous and design.' },
    { id: 'life', title: 'Life / memories', description: 'A community role, with space for personal memories.' },
    { id: 'experiments', title: 'Experiments / unfinished work', description: 'A published digital experiment and a place for unfinished work.' },
  ],
  entries: [
    ...projects.map(projectEntry),
    {
      id: 'programming', section: 'interests', title: 'Programming', kind: 'Interest',
      summary: 'C++ for competitive programming. Swift for Mac apps.', status: 'available',
      body: [{ type: 'text', paragraphs: ['I make apps, websites, and games. I write C++ for competitive programming and Swift for Mac apps.'] }],
      source: 'about.html',
    },
    {
      id: 'piano-records', section: 'interests', title: 'Piano & records', kind: 'Music',
      summary: 'Playing piano and listening to records.', status: 'available',
      body: [{ type: 'text', paragraphs: ['I play piano and listen to records.'] }],
      source: 'about.html',
    },
    {
      id: 'elite-dangerous', section: 'interests', title: 'Elite Dangerous', kind: 'Game',
      summary: 'A game I play.', status: 'available',
      body: [{ type: 'text', paragraphs: ['I play Elite Dangerous.'] }],
      source: 'about.html',
    },
    {
      id: 'industrial-design', section: 'interests', title: 'Spare, industrial design', kind: 'Design',
      summary: 'A design interest.', status: 'available',
      body: [{ type: 'text', paragraphs: ['I like spare, industrial design.'] }],
      source: 'about.html',
    },
    {
      id: 'masala-community', section: 'life', title: 'Masala Empire', kind: 'Community',
      summary: 'A community I helped build and served as its first president.', status: 'available',
      body: [
        { type: 'text', paragraphs: ['I helped build Masala Empire and served as its first president.'] },
        { type: 'link', label: 'Visit Masala Empire', href: community.url },
      ],
      source: 'projects.json: masala-empire',
    },
    {
      id: 'personal-memories', section: 'life', title: 'Personal memories — content needed', kind: 'Memories',
      summary: 'Personal memories, photos and captions have not been added.', status: 'needs-content',
      body: [],
    },
    {
      id: 'somnasculpt-experiment', section: 'experiments', title: experiment.name, kind: 'Published experiment',
      summary: experiment.description, status: 'available',
      body: [
        { type: 'link', label: 'Visit Somnasculpt', href: experiment.url },
      ],
      source: 'projects.json: somnasculpt (published)',
    },
    {
      id: 'unfinished-work', section: 'experiments', title: 'Unfinished work — content needed', kind: 'Work in progress',
      summary: 'Unfinished project notes have not been added.', status: 'needs-content',
      body: [],
    },
  ],
};
