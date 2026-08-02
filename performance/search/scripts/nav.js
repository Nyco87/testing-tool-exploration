const VIEWS = ['overview', 'requests', 'checks', 'thresholds', 'errors', 'trends', 'glossary'];

export function initNav(data) {
  const links = document.querySelectorAll('.nav__link');
  const views = document.querySelectorAll('.view');

  function activate(name) {
    if (!VIEWS.includes(name)) name = 'overview';
    links.forEach((l) => l.classList.toggle('is-active', l.dataset.view === name));
    views.forEach((v) => v.classList.toggle('is-active', v.dataset.view === name));
    document.title = `${titleFor(name)} · Pitwall`;
    closeMobileNav();
  }

  links.forEach((l) => {
    l.addEventListener('click', () => {
      location.hash = l.dataset.view;
    });
  });

  window.addEventListener('hashchange', () => activate(location.hash.replace('#', '')));
  activate(location.hash.replace('#', '') || 'overview');

  // status flags
  const thresholdsFailed = data.thresholds.some((t) => !t.ok);
  const checksFailed = data.checks.total && data.checks.fails > 0;
  setFlag('thresholds', data.thresholds.length ? (thresholdsFailed ? 'fail' : 'pass') : null);
  setFlag('checks', data.checks.total ? (checksFailed ? 'warn' : 'pass') : null);
  setFlag('errors', data.errors.length ? 'warn' : null);

  initMobileNav();
  initThemeToggle();
}

function setFlag(view, kind) {
  const link = document.querySelector(`.nav__link[data-view="${view}"]`);
  if (!link) return;
  let flag = link.querySelector('.nav__flag');
  if (!kind) { if (flag) flag.remove(); return; }
  if (!flag) {
    flag = document.createElement('span');
    flag.className = 'nav__flag';
    link.appendChild(flag);
  }
  flag.className = `nav__flag nav__flag--${kind}`;
}

function titleFor(name) {
  const map = { overview: 'Overview', requests: 'Requests', checks: 'Checks', thresholds: 'Thresholds', errors: 'Errors', trends: 'Trends', glossary: 'Glossary' };
  return map[name] || 'Report';
}

function initMobileNav() {
  const btn = document.querySelector('.topbar__btn');
  const sidebar = document.querySelector('.sidebar');
  const scrim = document.querySelector('.sidebar-scrim');
  if (!btn) return;
  btn.addEventListener('click', () => {
    sidebar.classList.add('is-open');
    scrim.classList.add('is-open');
  });
  scrim.addEventListener('click', closeMobileNav);
}

function closeMobileNav() {
  const sidebar = document.querySelector('.sidebar');
  const scrim = document.querySelector('.sidebar-scrim');
  if (sidebar) sidebar.classList.remove('is-open');
  if (scrim) scrim.classList.remove('is-open');
}

function initThemeToggle() {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  const stored = safeGet('pitwall-theme');
  if (stored) document.documentElement.setAttribute('data-theme', stored);
  updateLabel();

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    safeSet('pitwall-theme', next);
    updateLabel();
  });

  function updateLabel() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    btn.textContent = current === 'dark' ? '☾ dark' : '☀ light';
  }
}

function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); } catch { /* ignore */ } }
