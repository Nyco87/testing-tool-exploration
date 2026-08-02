import { renderTimeSeriesChart } from '../charts.js';
import { renderTable } from '../tables.js';
import { fmtMs, fmtMsTick, fmtPct, fmtNum, fmtDate, fmtDuration } from '../format.js';

export function renderTrends(container, data, history) {
  const w = document.createElement('div');
  w.innerHTML = `
    <div class="view__header">
      <div>
        <span class="view__eyebrow">Trends</span>
        <h1 class="view__title">Across runs</h1>
        <div class="view__subtitle">${history.length} run${history.length === 1 ? '' : 's'} tracked. History carries forward automatically each time you run <code>pitwall generate</code> against the same output directory.</div>
      </div>
    </div>
    <div id="trend-body"></div>
  `;
  container.innerHTML = '';
  container.appendChild(w);

  const body = document.getElementById('trend-body');
  if (history.length < 2) {
    body.innerHTML = `<div class="empty-note">Only one run has been recorded so far. Run <code>pitwall generate</code> again against the same <code>--history-dir</code> (or output directory) after your next test to start building a trend.</div>`;
    return;
  }

  const timestamps = history.map((h) => Date.parse(h.generatedAt));
  body.innerHTML = `
    <div class="two-col" style="margin-bottom: var(--sp-5);">
      <div class="panel panel--bracketed chart-panel">
        <div class="chart-panel__head"><div class="chart-panel__title">p95 duration</div></div>
        <div id="trend-p95"></div>
      </div>
      <div class="panel chart-panel">
        <div class="chart-panel__head"><div class="chart-panel__title">Failed requests</div></div>
        <div id="trend-fail"></div>
      </div>
    </div>
    <div class="two-col" style="margin-bottom: var(--sp-6);">
      <div class="panel chart-panel">
        <div class="chart-panel__head"><div class="chart-panel__title">Throughput</div></div>
        <div id="trend-rps"></div>
      </div>
      <div class="panel chart-panel">
        <div class="chart-panel__head"><div class="chart-panel__title">Checks pass rate</div></div>
        <div id="trend-checks"></div>
      </div>
    </div>
    <div class="section">
      <div class="section__head"><div class="section__title">Run history</div></div>
      <div id="trend-table"></div>
    </div>
  `;

  const durThreshold = findDurationThreshold(data);

  renderTimeSeriesChart(document.getElementById('trend-p95'), {
    timestamps, series: [{ id: 'p95', label: 'p95', values: history.map((h) => h.p95DurationMs), color: 'var(--signal)' }],
    thresholdLine: durThreshold,
    formatY: (v, axisMax) => fmtMsTick(v, axisMax), height: 190,
    formatX: (t) => fmtDate(t), formatXSub: () => '',
  });
  renderTimeSeriesChart(document.getElementById('trend-fail'), {
    timestamps, series: [{ id: 'fail', label: 'failed', values: history.map((h) => h.failedRequestRate), color: 'var(--fail)', fill: true }],
    formatY: (v) => fmtPct(v), height: 190,
    formatX: (t) => fmtDate(t), formatXSub: () => '',
  });
  renderTimeSeriesChart(document.getElementById('trend-rps'), {
    timestamps, series: [{ id: 'rps', label: 'req/s', values: history.map((h) => h.requestRate), color: 'var(--signal)', fill: true }],
    formatY: (v) => fmtNum(v), height: 190,
    formatX: (t) => fmtDate(t), formatXSub: () => '',
  });
  renderTimeSeriesChart(document.getElementById('trend-checks'), {
    timestamps, series: [{ id: 'checks', label: 'pass rate', values: history.map((h) => h.checksPassRate), color: 'var(--pass)' }],
    formatY: (v) => fmtPct(v), height: 190,
    formatX: (t) => fmtDate(t), formatXSub: () => '',
  });

  const rows = history.slice().reverse().map((h, i) => ({ ...h, _idx: history.length - i }));
  renderTable(document.getElementById('trend-table'), {
    columns: [
      { key: '_idx', label: '#', numeric: true },
      { key: 'generatedAt', label: 'Run', format: (v) => fmtDate(Date.parse(v)) },
      { key: 'verdict', label: 'Verdict', format: (v) => `<span class="stamp stamp--${v === 'pass' ? 'pass' : v === 'fail' ? 'fail' : 'neutral'}">${v}</span>` },
      { key: 'durationMs', label: 'Duration', numeric: true, format: (v) => fmtDuration(v) },
      { key: 'vusMax', label: 'Max VUs', numeric: true, format: (v) => fmtNum(v) },
      { key: 'requests', label: 'Requests', numeric: true, format: (v) => fmtNum(v) },
      { key: 'p95DurationMs', label: 'p95', numeric: true, format: (v) => fmtMs(v) },
      { key: 'failedRequestRate', label: 'Fail %', numeric: true, format: (v) => fmtPct(v) },
      { key: 'checksPassRate', label: 'Checks', numeric: true, format: (v) => (v != null ? fmtPct(v, 1) : '—') },
    ],
    rows,
    defaultSort: '_idx',
    defaultDir: 'desc',
  });
}

/** Best-effort: use the current run's configured duration threshold as context on the trend chart too. */
function findDurationThreshold(data) {
  const t = data.thresholds.find((th) => th.metric === 'http_req_duration');
  if (!t) return null;
  const m = String(t.expr).match(/(-?\d+(?:\.\d+)?)\s*$/);
  const value = m ? parseFloat(m[1]) : null;
  return value != null ? { value, label: t.expr } : null;
}
