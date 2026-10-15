import './main.css';
import { archiveContent } from './content';
import type { ArchiveController, RoomController, ViewState } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <section class="room-shell" aria-label="SimonLM's room">
    <div class="room-host" aria-hidden="true"></div>
    <header class="room-heading"><span>SimonLM</span><span class="room-heading-note">Projects & things kept</span></header>
    <div class="room-status" role="status" aria-live="polite">Opening the room…</div>
    <div class="room-controls" hidden>
      <span class="room-hint">Move your pointer to look around.</span>
      <button class="enter-computer" type="button">Use computer <span aria-hidden="true">↵</span></button>
    </div>
    <button class="return-room" type="button" hidden>← Return to room <kbd>Esc</kbd></button>
    <label class="motion-control"><input class="reduce-motion" type="checkbox"> Reduce motion</label>
    <div class="desktop-notice" hidden>
      <h1>A room for a desktop.</h1>
      <p>Open this on a desktop with a mouse or trackpad to look around and use the computer.</p>
      <a href="/projects.html">View projects</a>
    </div>
    <footer class="room-footer"><a href="/projects.html">Project index</a><a href="mailto:simonlm@simonlm.one">Email</a></footer>
  </section>`;

const shell = app.querySelector<HTMLElement>('.room-shell')!;
const host = app.querySelector<HTMLElement>('.room-host')!;
const status = app.querySelector<HTMLElement>('.room-status')!;
const controls = app.querySelector<HTMLElement>('.room-controls')!;
const enter = app.querySelector<HTMLButtonElement>('.enter-computer')!;
const exit = app.querySelector<HTMLButtonElement>('.return-room')!;
const notice = app.querySelector<HTMLElement>('.desktop-notice')!;
const motionControl = app.querySelector<HTMLInputElement>('.reduce-motion')!;
const roomHint = app.querySelector<HTMLElement>('.room-hint')!;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const unsupportedDisplay = window.matchMedia('(max-width: 999px), (hover: none), (pointer: coarse)');
motionControl.checked = motionPreference.matches;
function updateMotionHint() {
  roomHint.textContent = motionControl.checked ? 'Click the monitor to use the computer.' : 'Move your pointer to look around.';
}
updateMotionHint();
let archive: ArchiveController | undefined;
let room: RoomController | undefined;
let view: ViewState = 'seated';
let directArchive = false;
let disposed = false;

function focusArchive() {
  if (!archive) return;
  const target = archive.element.querySelector<HTMLElement>('button:not([disabled]), a[href], video[controls], [tabindex="0"]');
  (target ?? archive.element).focus({ preventScroll: true });
}

function updateView(state: ViewState) {
  view = state;
  shell.dataset.view = state;
  const isFocused = state === 'focused';
  const inComputer = state !== 'seated';
  host.setAttribute('aria-hidden', String(!isFocused));
  archive?.setActive(isFocused);
  controls.hidden = inComputer || unsupportedDisplay.matches;
  exit.hidden = !inComputer || directArchive;
  exit.disabled = state === 'returning';
  enter.disabled = state !== 'seated';
  if (state === 'seated' && !unsupportedDisplay.matches) enter.focus({ preventScroll: true });
}

function enterComputer() {
  if (!room || view !== 'seated') return;
  archive?.navigate?.(window.location.hash);
  room.focus();
}

function returnToRoom() {
  if (!room || directArchive || view === 'seated' || view === 'returning') return;
  archive?.setActive(false);
  room.returnToSeat();
}

function showDirectArchive() {
  if (!archive) return;
  room?.dispose();
  room = undefined;
  directArchive = true;
  shell.classList.add('direct-archive');
  host.replaceChildren(archive.element);
  host.setAttribute('aria-hidden', 'false');
  archive.setActive(true);
  controls.hidden = true;
  exit.hidden = true;
  status.hidden = false;
  status.textContent = 'The room is unavailable on this browser. You can still browse here.';
  archive.navigate?.(window.location.hash);
  focusArchive();
}

function updateDisplaySupport() {
  const unsupported = unsupportedDisplay.matches;
  shell.classList.toggle('unsupported-display', unsupported);
  notice.hidden = !unsupported;
  host.inert = unsupported;
  if (unsupported) {
    archive?.setActive(false);
    controls.hidden = true;
    exit.hidden = true;
  } else if (directArchive) {
    archive?.setActive(true);
  } else {
    controls.hidden = view !== 'seated';
    exit.hidden = view === 'seated';
    archive?.setActive(view === 'focused');
  }
}

enter.addEventListener('click', enterComputer);
exit.addEventListener('click', returnToRoom);
motionControl.addEventListener('change', () => {
  updateMotionHint();
  room?.setReducedMotion(motionControl.checked);
});
motionPreference.addEventListener('change', () => {
  motionControl.checked = motionPreference.matches;
  updateMotionHint();
  room?.setReducedMotion(motionControl.checked);
});
unsupportedDisplay.addEventListener('change', updateDisplaySupport);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !directArchive && view !== 'seated') {
    event.preventDefault();
    returnToRoom();
  }
  if (event.key !== 'Tab' || view !== 'focused' || !archive || directArchive) return;
  const items = [...archive.element.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), video[controls], [tabindex="0"]')]
    .filter((element) => !element.closest('[hidden], [inert]') && element.getClientRects().length > 0);
  if (!exit.hidden && !exit.disabled) items.push(exit);
  const first = items[0];
  const last = items.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement as HTMLElement))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement as HTMLElement))) {
    event.preventDefault(); first.focus();
  }
});

window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  disposed = true;
  archive?.dispose();
  room?.dispose();
});

async function initialize() {
  updateDisplaySupport();
  try {
    const { createArchive } = await import('./archive/archive');
    if (disposed) return;
    archive = createArchive({ content: archiveContent, onExit: returnToRoom });
    archive.element.tabIndex = -1;
    archive.setActive(false);
    try {
      const { createRoom } = await import('./scene/room');
      if (disposed) return;
      room = createRoom({
        host,
        screenElement: archive.element,
        reducedMotion: motionControl.checked,
        onViewChange: updateView,
        onMonitorActivate: enterComputer,
      });
      status.hidden = true;
      updateView('seated');
      updateDisplaySupport();
      if (!unsupportedDisplay.matches && /^#(?:\/|projects)/.test(window.location.hash)) enterComputer();
    } catch (error) {
      console.error('Room could not start:', error);
      showDirectArchive();
      updateDisplaySupport();
    }
  } catch (error) {
    console.error('Archive could not start:', error);
    status.textContent = 'The room could not load. The project index is still available below.';
    shell.classList.add('load-failed');
  }
}

void initialize();
