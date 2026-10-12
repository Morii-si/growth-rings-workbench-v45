const VERSIONS = [
  { version: '1', title: '初始研究', date: '2026.02' },
  { version: '2', title: '2025 年业绩研究', date: '2026.03.25' },
  { version: '3', title: '2026 年半年报研究', date: '本次生成' },
];

const chevron = '<svg class="board-version-chevron" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m4 6 4 4 4-4"/></svg>';
const check = '<svg class="board-version-check" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 9 3.3 3.3L14 5.5"/></svg>';

export function renderBoardVersionMenu({ selected = '3', hasGenerated = true, current = true } = {}) {
  const versions = VERSIONS.filter(item => hasGenerated || item.version !== '3');
  const value = versions.some(item => item.version === String(selected)) ? String(selected) : '2';
  return `<div class="company-board-menu" ${current ? 'data-current="true"' : ''}>
    <button type="button" id="history-board-trigger" class="history-board-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="history-board-options">
      历史研究看板 <span class="board-menu-version">V${value}</span>${chevron}
    </button>
    <div id="history-board-options" class="board-version-popover" role="menu" aria-label="历史研究看板" hidden>
      ${versions.map(item => `<button type="button" class="board-version-option" role="menuitemradio" aria-checked="${item.version === value}" data-board-version="${item.version}" tabindex="-1">
        <span class="board-version-badge">V${item.version}</span>
        <span class="board-version-copy"><strong>${item.title}</strong><small>${item.date}</small></span>
        ${check}
      </button>`).join('')}
    </div>
  </div>`;
}

let installed = false;
let selectVersion = () => {};
let activeMenu = null;

function closeMenu({ restoreFocus = false } = {}) {
  if (!activeMenu) return;
  const { trigger, panel } = activeMenu;
  trigger.setAttribute('aria-expanded', 'false');
  panel.hidden = true;
  activeMenu = null;
  if (restoreFocus && trigger.isConnected) trigger.focus({ preventScroll: true });
}

function placeMenu() {
  if (!activeMenu) return;
  const { trigger, panel } = activeMenu;
  if (!trigger.isConnected) { closeMenu(); return; }
  const viewport = window.visualViewport;
  const leftEdge = viewport?.offsetLeft || 0;
  const topEdge = viewport?.offsetTop || 0;
  const width = viewport?.width || innerWidth;
  const height = viewport?.height || innerHeight;
  const anchor = trigger.getBoundingClientRect();
  if (anchor.bottom < topEdge || anchor.top > topEdge + height) { closeMenu(); return; }
  const gutter = 12;
  const panelWidth = Math.min(328, width - gutter * 2);
  const left = Math.max(leftEdge + gutter, Math.min(anchor.left - 12, leftEdge + width - panelWidth - gutter));
  panel.style.width = `${panelWidth}px`;
  panel.style.left = `${left}px`;
  panel.style.maxHeight = `${Math.max(64, height - gutter * 2)}px`;
  const desiredHeight = Math.min(panel.scrollHeight, height - gutter * 2);
  const below = topEdge + height - anchor.bottom - 8 - gutter;
  const above = anchor.top - topEdge - 8 - gutter;
  const useAbove = below < desiredHeight && above > below;
  const available = Math.max(64, useAbove ? above : below);
  const panelHeight = Math.min(desiredHeight, available);
  const top = useAbove ? anchor.top - 8 - panelHeight : anchor.bottom + 8;
  panel.style.maxHeight = `${panelHeight}px`;
  panel.style.top = `${Math.max(topEdge + gutter, Math.min(top, topEdge + height - panelHeight - gutter))}px`;
}

function openMenu(trigger, edge) {
  closeMenu();
  const panel = trigger.closest('.company-board-menu')?.querySelector('.board-version-popover');
  if (!panel) return;
  activeMenu = { trigger, panel };
  panel.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  placeMenu();
  const options = [...panel.querySelectorAll('[data-board-version]')];
  const selected = options.find(option => option.getAttribute('aria-checked') === 'true');
  const target = edge === 'first' ? options[0] : edge === 'last' ? options.at(-1) : selected;
  target?.focus({ preventScroll: true });
  target?.scrollIntoView({ block: 'nearest' });
}

export function installBoardVersionMenu({ onSelect } = {}) {
  if (typeof onSelect === 'function') selectVersion = onSelect;
  if (installed) return;
  installed = true;

  document.addEventListener('pointerdown', event => {
    if (activeMenu && !event.target.closest('.company-board-menu')) closeMenu();
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('.history-board-trigger');
    if (trigger) {
      activeMenu?.trigger === trigger ? closeMenu() : openMenu(trigger);
      return;
    }
    const option = event.target.closest('.board-version-option');
    if (!option || !activeMenu?.panel.contains(option)) return;
    const version = option.dataset.boardVersion;
    closeMenu();
    selectVersion(version);
    requestAnimationFrame(() => document.querySelector('.history-board-trigger')?.focus({ preventScroll: true }));
  });

  document.addEventListener('keydown', event => {
    const trigger = event.target.closest('.history-board-trigger');
    if (trigger && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (activeMenu?.trigger === trigger && ['Enter', ' '].includes(event.key)) closeMenu();
      else openMenu(trigger, event.key === 'ArrowDown' ? 'first' : event.key === 'ArrowUp' ? 'last' : undefined);
      return;
    }
    if (!activeMenu || !activeMenu.panel.contains(event.target)) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }
    if (event.key === 'Tab') {
      // Move the starting point back to the trigger; native Tab then leaves the menu.
      closeMenu({ restoreFocus: true });
      return;
    }
    const options = [...activeMenu.panel.querySelectorAll('[data-board-version]')];
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % options.length;
    if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    options[next].focus({ preventScroll: true });
    options[next].scrollIntoView({ block: 'nearest' });
  });

  document.addEventListener('focusin', event => {
    if (activeMenu && !event.target.closest('.company-board-menu')) closeMenu();
  });
  window.addEventListener('resize', placeMenu);
  window.addEventListener('scroll', event => {
    if (activeMenu && event.target !== activeMenu.panel) placeMenu();
  }, true);
  window.visualViewport?.addEventListener('resize', placeMenu);
  window.visualViewport?.addEventListener('scroll', placeMenu);
}
