import { renderTable } from '../tables.js';
import { fmtNum, fmtPct, escapeHtml } from '../format.js';

function isOkStatus(status) {
  const n = Number(status);
  return Number.isFinite(n) && n >= 200 && n < 400;
}

export function renderErrors(container, data) {
  const w = document.createElement('div');
  w.innerHTML = `
    <div class="view__header">
      <div>
        <span class="view__eyebrow">Errors</span>
        <h1 class="view__title">Failed requests</h1>
        <div class="view__subtitle">Non-2xx/3xx responses and network errors, grouped by endpoint and status.</div>
      </div>
    </div>
    <div id="status-dist"></div>
    <div id="errors-table"></div>
  `;
  container.innerHTML = '';
  container.appendChild(w);

  const total = data.headline.requests || 0;

  const distEl = document.getElementById('status-dist');
  const dist = data.statusDistribution || [];
  if (dist.length) {
    const section = document.createElement('div');
    section.className = 'section';
    section.style.marginBottom = 'var(--sp-6)';
    section.innerHTML = `<div class="section__head"><div class="section__title">Status codes</div><div class="section__note">Every response status seen during the run — <code>err:*</code> rows are network-level failures (DNS, connect, timeout), <code>0</code> means no response.</div></div><div id="status-dist-table"></div>`;
    distEl.appendChild(section);
    renderTable(document.getElementById('status-dist-table'), {
      columns: [
        { key: 'status', label: 'Status', format: (v) => `<span class="stamp ${isOkStatus(v) ? 'stamp--pass' : 'stamp--fail'}">${escapeHtml(v)}</span>` },
        { key: 'count', label: 'Responses', numeric: true, format: (v) => fmtNum(v) },
        { key: 'share', label: '% of requests', numeric: true, format: (v) => fmtPct(v) },
      ],
      rows: dist,
      defaultSort: 'count',
    });
  }

  const el = document.getElementById('errors-table');

  if (!data.errors.length) {
    el.innerHTML = `<div class="empty-note">${total ? 'No failed requests recorded — clean run.' : "No per-endpoint error data is available. This requires the raw <code>--out json=</code> results file."}</div>`;
    return;
  }

  const section = document.createElement('div');
  section.className = 'section';
  section.innerHTML = `<div class="section__head"><div class="section__title">Failed requests by endpoint</div></div><div id="errors-table-inner"></div>`;
  el.appendChild(section);

  renderTable(document.getElementById('errors-table-inner'), {
    columns: [
      { key: 'method', label: 'Method', format: (v) => `<span class="method-chip">${escapeHtml(v)}</span>` },
      { key: 'status', label: 'Status', format: (v) => `<span class="stamp stamp--fail">${escapeHtml(v)}</span>` },
      { key: 'name', label: 'Endpoint', cellClass: () => 'is-name' },
      { key: 'count', label: 'Occurrences', numeric: true, format: (v) => fmtNum(v) },
      { key: 'share', label: '% of requests', numeric: true, format: (v) => fmtPct(v) },
    ],
    rows: data.errors.map((e) => ({ ...e, share: total ? e.count / total : 0 })),
    defaultSort: 'count',
    searchable: true,
    searchPredicate: (r, q) => r.name.toLowerCase().includes(q) || String(r.status).includes(q),
  });
}
