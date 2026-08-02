import { renderTable } from '../tables.js';
import { fmtMs, fmtPct, fmtNum, escapeHtml } from '../format.js';

export function renderRequests(container, data) {
  const w = document.createElement('div');
  w.innerHTML = `
    <div class="view__header">
      <div>
        <span class="view__eyebrow">Requests</span>
        <h1 class="view__title">By endpoint</h1>
        <div class="view__subtitle">Every request grouped by method &amp; URL, with full latency distribution and failure rate.</div>
      </div>
    </div>
    <div id="req-table"></div>
  `;
  container.innerHTML = '';
  container.appendChild(w);

  if (!data.requestsByEndpoint.length) {
    document.getElementById('req-table').innerHTML = `<div class="empty-note">No per-endpoint breakdown is available. This requires the raw <code>--out json=</code> results file — the end-of-test summary alone doesn't retain per-request tags.</div>`;
    return;
  }

  renderTable(document.getElementById('req-table'), {
    columns: [
      { key: 'method', label: 'Method', format: (v) => `<span class="method-chip">${escapeHtml(v)}</span>` },
      { key: 'name', label: 'Endpoint', cellClass: () => 'is-name' },
      { key: 'count', label: 'Requests', numeric: true, format: (v) => fmtNum(v) },
      { key: 'failRate', label: 'Fail %', numeric: true, format: (v) => fmtPct(v), cellClass: (r) => (r.failRate > 0.05 ? 'is-fail' : r.failRate > 0 ? 'is-warn' : 'is-pass') },
      { key: 'avg', label: 'Avg', numeric: true, format: (v) => fmtMs(v) },
      { key: 'med', label: 'Median', numeric: true, format: (v) => fmtMs(v) },
      { key: 'p90', label: 'p90', numeric: true, format: (v) => fmtMs(v) },
      { key: 'p95', label: 'p95', numeric: true, format: (v) => fmtMs(v) },
      { key: 'p99', label: 'p99', numeric: true, format: (v) => fmtMs(v) },
      { key: 'max', label: 'Max', numeric: true, format: (v) => fmtMs(v) },
    ],
    rows: data.requestsByEndpoint,
    defaultSort: 'count',
    searchable: true,
    searchPredicate: (r, q) => r.name.toLowerCase().includes(q) || r.method.toLowerCase().includes(q),
  });
}
