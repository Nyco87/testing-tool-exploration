import { renderTable } from '../tables.js';
import { fmtPct, fmtNum } from '../format.js';
import { flattenChecks } from './overview.js';

export function renderChecks(container, data) {
  const w = document.createElement('div');
  w.innerHTML = `
    <div class="view__header">
      <div>
        <span class="view__eyebrow">Checks</span>
        <h1 class="view__title">Assertions</h1>
        <div class="view__subtitle">Checks are informational — they record pass/fail counts but never stop a test or fail the run on their own. Use thresholds for pass/fail gates.</div>
      </div>
    </div>
    ${data.checks.total ? `
    <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--sp-6);">
      <div class="stat-tile"><div class="stat-tile__label">Total evaluations</div><div class="stat-tile__value">${fmtNum(data.checks.total)}</div></div>
      <div class="stat-tile"><div class="stat-tile__label">Passed</div><div class="stat-tile__value" style="color:var(--pass)">${fmtNum(data.checks.passes)}</div></div>
      <div class="stat-tile"><div class="stat-tile__label">Pass rate</div><div class="stat-tile__value">${fmtPct(data.checks.rate, 1)}</div></div>
    </div>
    <div id="checks-table"></div>
    ` : `<div class="empty-note">No checks were recorded for this run. Add <code>check()</code> calls to your script to assert on response conditions.</div>`}
  `;
  container.innerHTML = '';
  container.appendChild(w);

  if (!data.checks.total) return;

  const rows = flattenChecks(data.checks.tree).map((c) => ({ ...c, rate: c.passes + c.fails ? c.passes / (c.passes + c.fails) : 0 }));

  renderTable(document.getElementById('checks-table'), {
    columns: [
      { key: 'name', label: 'Check', cellClass: () => 'is-name' },
      { key: 'passes', label: 'Passed', numeric: true, format: (v) => fmtNum(v) },
      { key: 'fails', label: 'Failed', numeric: true, format: (v) => fmtNum(v), cellClass: (r) => (r.fails > 0 ? 'is-fail' : '') },
      { key: 'rate', label: 'Pass rate', numeric: true, format: (v) => fmtPct(v, 1) },
    ],
    rows,
    defaultSort: 'fails',
    searchable: true,
    searchPredicate: (r, q) => r.name.toLowerCase().includes(q),
  });
}
