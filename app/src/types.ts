export type ViewState = 'seated' | 'focusing' | 'focused' | 'returning';

export type ArchiveSectionId = 'projects' | 'interests' | 'life' | 'experiments';

export type ArchiveBodyBlock =
  | { type: 'text'; paragraphs: string[] }
  | { type: 'image'; src: string; alt: string; caption?: string; width?: number; height?: number }
  | { type: 'video'; src: string; poster?: string; caption?: string }
  | { type: 'link'; label: string; href: string };

export interface ArchiveEntry {
  id: string;
  section: ArchiveSectionId;
  title: string;
  kind: string;
  summary: string;
  status?: 'available' | 'needs-content';
  body: ArchiveBodyBlock[];
  source?: string;
}

export interface ArchiveSection {
  id: ArchiveSectionId;
  title: string;
  description: string;
}

export interface ArchiveContent {
  owner: { name: string; handle: string; description: string };
  contact: { email: string; links: { label: string; href: string }[] };
  sections: ArchiveSection[];
  entries: ArchiveEntry[];
}

export interface RoomOptions {
  host: HTMLElement;
  screenElement: HTMLElement;
  reducedMotion: boolean;
  onViewChange: (state: ViewState) => void;
  onMonitorActivate: () => void;
}

export interface RoomController {
  focus(): void;
  returnToSeat(): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}

export interface ArchiveOptions {
  content: ArchiveContent;
  onExit: () => void;
}

export interface ArchiveController {
  element: HTMLElement;
  setActive(active: boolean): void;
  dispose(): void;
  navigate?(hash: string): void;
}
