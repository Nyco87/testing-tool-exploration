import { fmtMs, fmtPct } from '../format.js';

export function renderThresholds(container, data) {
  const w = document.createElement('div');
  w.innerHTML = `
    <div class="view__header">
      <div>
        <span class="view__eyebrow">Thresholds</span>
        <h1 class="view__title">Pass / fail criteria</h1>
        <div class="view__subtitle">Thresholds are the only thing that determines a test's pass/fail verdict and k6's exit code. Each bar shows how the measured value compares to its limit — the dashed mark is the limit itself.</div>
      </div>
    </div>
    <div id="thresholds-list"></div>
  `;
  container.innerHTML = '';
  container.appendChild(w);

  const listEl = document.getElementById('thresholds-list');
  if (!data.thresholds.length) {
    listEl.innerHTML = `<div class="empty-note">
      No thresholds are configured for this test, so there's nothing to gate pass/fail on.<br/>
      Add something like this to your script's <code>options</code>:<br/><br/>
      <code class="mono">thresholds: { http_req_duration: ['p(95)&lt;500'], http_req_failed: ['rate&lt;0.01'] }</code>
    </div>`;
    return;
  }

  listEl.innerHTML = data.thresholds.map(thresholdRow).join('');
}

function thresholdRow(t) {
  const isRate = t.stat === 'rate' || t.expr.includes('rate');
  const fmt = isRate ? (v) => fmtPct(v) : (v) => fmtMs(v);
  const target = t.target ?? parseTarget(t.expr);
  const actual = t.actual;
  const max = Math.max(actual || 0, target || 0) * 1.25 || 1;
  const actualPct = Math.min(100, ((actual || 0) / max) * 100);
  const targetPct = Math.min(100, ((target || 0) / max) * 100);

  return `
    <div class="panel" style="margin-bottom: var(--sp-3);">
      <div style="display:flex; align-items:baseline; justify-content:space-between; gap: var(--sp-3); margin-bottom: 10px; flex-wrap:wrap;">
        <div>
          <span class="mono" style="font-weight:600;">${escapeHtml(t.metric)}</span>
          <span class="mono" style="color:var(--ink-muted); margin-left:8px;">${escapeHtml(t.expr)}</span>
        </div>
        <span class="stamp stamp--${t.ok ? 'pass' : 'fail'}">${t.ok ? 'pass' : 'fail'}</span>
      </div>
      <div style="position:relative; height:20px; background:var(--paper); border-radius: var(--radius-sm); overflow:visible; border:1px solid var(--line);">
        <div style="position:absolute; inset:0; width:${actualPct}%; background:${t.ok ? 'var(--pass)' : 'var(--fail)'}; opacity:0.55; border-radius: var(--radius-sm) 0 0 var(--radius-sm);"></div>
        ${target != null ? `<div style="position:absolute; top:-3px; bottom:-3px; left:${targetPct}%; width:0; border-left: 2px dashed var(--fail-strong);" title="limit: ${escapeHtml(t.expr)}"></div>` : ''}
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:6px;">
        <span class="mono" style="font-size:var(--text-2xs); color:var(--ink-muted);">measured <strong style="color:var(--ink); font-size:var(--text-sm);">${actual != null ? fmt(actual) : '—'}</strong></span>
        <span class="mono" style="font-size:var(--text-2xs); color:var(--ink-muted);">limit <strong style="color:var(--fail-strong); font-size:var(--text-sm);">${target != null ? fmt(target) : '—'}</strong></span>
      </div>
    </div>
  `;
}

function parseTarget(expr) {
  const m = String(expr).match(/(-?\d+(?:\.\d+)?)\s*$/);
  return m ? parseFloat(m[1]) : null;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
