/** Escapes a value for safe interpolation into HTML. Report data (endpoint
 *  names, statuses, check names) comes from arbitrary test scripts and URLs,
 *  so anything rendered via innerHTML must pass through here. */
export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fmtMs(v) {
  if (v == null || Number.isNaN(v)) return '—';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(2) + ' s';
  if (Math.abs(v) < 10) return v.toFixed(2) + ' ms';
  return v.toFixed(1) + ' ms';
}

export function fmtNum(v, digits = 0) {
  if (v == null || Number.isNaN(v)) return '—';
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function fmtCompact(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

export function fmtPct(v, digits = 2) {
  if (v == null || Number.isNaN(v)) return '—';
  return (v * 100).toFixed(digits) + '%';
}

export function fmtBytes(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function fmtRate(v, unit = '/s') {
  if (v == null || Number.isNaN(v)) return '—';
  return fmtNum(v, v < 10 ? 1 : 0) + unit;
}

export function fmtDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '—';
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m || h) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

export function fmtElapsed(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function fmtClock(epochMs) {
  const d = new Date(epochMs);
  return d.toLocaleTimeString(undefined, { hour12: false });
}

export function fmtDate(epochMs) {
  const d = new Date(epochMs);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function fmtStatValue(stat, v) {
  if (stat === 'rate') return fmtPct(v);
  return fmtMs(v);
}

/** Y-axis tick formatter for duration charts - picks one unit (ms or s) for the whole axis, based on its max.
 *  Falls back to per-value smart formatting (like fmtMs) when no axisMax is given, e.g. in tooltips. */
export function fmtMsTick(v, axisMax) {
  const basis = axisMax != null ? axisMax : v;
  if (basis >= 1000) {
    const s = v / 1000;
    return (Number.isInteger(s) ? s.toFixed(0) : s.toFixed(2)) + ' s';
  }
  return Math.round(v) + ' ms';
}

/** Renders a threshold's stat key ("p(95)") the way a human would say it. */
export function fmtStatLabel(stat) {
  if (!stat) return '';
  const m = stat.match(/^p\(([\d.]+)\)$/);
  if (m) return `p${m[1]}`;
  return stat;
}
