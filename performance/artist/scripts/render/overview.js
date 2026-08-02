import { renderTimeSeriesChart } from '../charts.js';
import { fmtMs, fmtMsTick, fmtNum, fmtPct, fmtBytes, fmtRate, fmtDuration, fmtDate } from '../format.js';
import { compareDirection } from '../history-delta.js';

export function renderOverview(container, data, history) {
  const w = document.createElement('div');
  w.innerHTML = `
    <div class="view__header">
      <div>
        <span class="view__eyebrow">Test report</span>
        <h1 class="view__title">${escapeHtml(data.meta.testName)}</h1>
        <div class="view__subtitle">Generated ${fmtDate(Date.parse(data.meta.generatedAt))} · ${data.headline.durationMs ? fmtDuration(data.headline.durationMs) + ' run' : ''} ${data.headline.vusMax ? '· ' + fmtNum(data.headline.vusMax) + ' max VUs' : ''}</div>
      </div>
      <div class="run-id mono">${escapeHtml(data.meta.runId)}</div>
    </div>

    ${data.meta.warnings.length ? warningsBlock(data.meta.warnings) : ''}

    <div class="hero">
      <div>${verdictStamp(data)}</div>
      <div class="panel panel--bracketed" id="hero-chart-panel">
        <div class="chart-panel__head">
          <div class="chart-panel__title">Request duration over time</div>
          <div class="chart-legend" id="hero-legend"></div>
        </div>
        <div id="hero-chart"></div>
      </div>
    </div>

    <div class="stat-grid" id="stat-grid"></div>

    <div class="two-col">
      <div class="section">
        <div class="section__head"><div class="section__title">Thresholds</div><a href="#thresholds" class="section__note">view all →</a></div>
        <div id="ov-thresholds"></div>
      </div>
      <div class="section">
        <div class="section__head"><div class="section__title">Checks</div><a href="#checks" class="section__note">view all →</a></div>
        <div id="ov-checks"></div>
      </div>
    </div>

    ${data.timeseries.available ? `
    <div class="section">
      <div class="section__head"><div class="section__title">Load profile</div><div class="section__note">virtual users &amp; throughput</div></div>
      <div class="two-col">
        <div class="panel chart-panel">
          <div class="chart-panel__head"><div class="chart-panel__title">Active VUs</div></div>
          <div id="vus-chart"></div>
        </div>
        <div class="panel chart-panel">
          <div class="chart-panel__head"><div class="chart-panel__title">Requests / sec</div></div>
          <div id="rps-chart"></div>
        </div>
      </div>
    </div>` : ''}

    ${data.requestsByEndpoint.length ? `
    <div class="section">
      <div class="section__head"><div class="section__title">Slowest endpoints</div><a href="#requests" class="section__note">view all →</a></div>
      <div id="ov-slow-endpoints"></div>
    </div>` : ''}
  `;
  container.innerHTML = '';
  container.appendChild(w);

  renderStatGrid(document.getElementById('stat-grid'), data, history);
  renderHeroChart(data);
  if (data.timeseries.available) {
    renderVusChart(data);
    renderRpsChart(data);
  }
  renderThresholdsPreview(document.getElementById('ov-thresholds'), data);
  renderChecksPreview(document.getElementById('ov-checks'), data);
  if (data.requestsByEndpoint.length) renderSlowEndpoints(document.getElementById('ov-slow-endpoints'), data);
}

function warningsBlock(warnings) {
  return `<div class="panel" style="border-color:var(--warn); margin-bottom: var(--sp-6); background: var(--warn-wash);">
    ${warnings.map((w) => `<div style="font-size:var(--text-sm); color:var(--warn-strong);">⚠ ${escapeHtml(w)}</div>`).join('')}
  </div>`;
}

function verdictStamp(data) {
  const v = data.verdict;
  const cls = v === 'pass' ? '' : v === 'fail' ? 'is-fail' : 'is-neutral';
  const label = v === 'pass' ? 'Pass' : v === 'fail' ? 'Fail' : 'Complete';
  const failedCount = data.thresholds.filter((t) => !t.ok).length;
  let meta;
  if (v === 'neutral') meta = 'No thresholds were configured for this run.';
  else meta = `<strong>${data.thresholds.length - failedCount}/${data.thresholds.length}</strong> thresholds held${failedCount ? `, <strong style="color:var(--fail)">${failedCount} breached</strong>` : ''}`;
  return `
    <div class="verdict-stamp">
      <div class="verdict-stamp__box ${cls}">${label}</div>
      <div class="verdict-stamp__meta">${meta}</div>
    </div>`;
}

function renderStatGrid(container, data, history) {
  const h = data.headline;
  const prev = history && history.length >= 2 ? history[history.length - 2] : null;
  const tiles = [
    { label: 'Requests', value: fmtNum(h.requests), delta: delta(h.requests, prev?.requests, null) },
    { label: 'Request rate', value: fmtRate(h.requestRate), delta: delta(h.requestRate, prev?.requestRate, null) },
    { label: 'P95 duration', value: fmtMs(h.p95DurationMs), delta: delta(h.p95DurationMs, prev?.p95DurationMs, 'lower') },
    { label: 'Avg duration', value: fmtMs(h.avgDurationMs), delta: delta(h.avgDurationMs, prev?.avgDurationMs, 'lower') },
    { label: 'Failed requests', value: fmtPct(h.failedRequestRate), delta: delta(h.failedRequestRate, prev?.failedRequestRate, 'lower') },
    { label: 'Checks passed', value: h.checksPassRate != null ? fmtPct(h.checksPassRate) : '—', delta: delta(h.checksPassRate, prev?.checksPassRate, 'higher') },
    { label: 'Max VUs', value: fmtNum(h.vusMax) },
    { label: 'Data sent', value: fmtBytes(h.dataSentBytes) },
    { label: 'Data received', value: fmtBytes(h.dataReceivedBytes) },
  ];
  container.innerHTML = tiles.map((t) => `
    <div class="stat-tile">
      <div class="stat-tile__label">${t.label}</div>
      <div class="stat-tile__value">${t.value}</div>
      ${t.delta ? `<div class="stat-tile__delta stat-tile__delta--${t.delta.direction}">${t.delta.text}</div>` : ''}
    </div>
  `).join('');
}

function delta(current, previous, better) {
  if (current == null || previous == null) return null;
  const cmp = compareDirection(current, previous, better);
  if (cmp.pct == null) return null;
  const arrow = cmp.pct > 0 ? '▲' : cmp.pct < 0 ? '▼' : '';
  return { direction: better ? cmp.direction : 'flat', text: `${arrow} ${Math.abs(cmp.pct).toFixed(1)}% vs last run` };
}

function findDurationThreshold(data) {
  return data.thresholds.find((t) => t.metric === 'http_req_duration') || null;
}

function renderHeroChart(data) {
  const ts = data.timeseries;
  const el = document.getElementById('hero-chart');
  const legend = document.getElementById('hero-legend');
  if (!ts.available || !ts.series.http_req_duration_avg) {
    el.innerHTML = `<div class="empty-note">No raw --out json results file was provided, so a time-series chart isn't available. The table below uses the end-of-test summary instead.</div>`;
    return;
  }
  const thr = findDurationThreshold(data);
  const thresholdLine = thr ? { value: thr.actual != null && thr.expr ? thresholdValueFromExpr(thr.expr) : null, label: thr.expr } : null;

  renderTimeSeriesChart(el, {
    timestamps: ts.timestamps,
    series: [
      { id: 'p95', label: 'p95 duration', values: ts.series.http_req_duration_p95, color: 'var(--signal)' },
      { id: 'avg', label: 'avg duration', values: ts.series.http_req_duration_avg, color: 'var(--ink-faint)' },
    ],
    thresholdLine: thresholdLine && thresholdLine.value ? thresholdLine : null,
    formatY: (v, axisMax) => fmtMsTick(v, axisMax),
    height: 240,
  });
  legend.innerHTML = `
    <span class="chart-legend__item"><span class="chart-legend__swatch" style="background:var(--signal)"></span>p95</span>
    <span class="chart-legend__item"><span class="chart-legend__swatch" style="background:var(--ink-faint)"></span>avg</span>
    ${thresholdLine && thresholdLine.value ? `<span class="chart-legend__item"><span class="chart-legend__swatch is-dashed" style="color:var(--fail)"></span>${escapeHtml(thresholdLine.label)}</span>` : ''}
  `;
}

function thresholdValueFromExpr(expr) {
  const m = String(expr).match(/(-?\d+(?:\.\d+)?)\s*$/);
  return m ? parseFloat(m[1]) : null;
}

function renderVusChart(data) {
  const ts = data.timeseries;
  renderTimeSeriesChart(document.getElementById('vus-chart'), {
    timestamps: ts.timestamps,
    series: [{ id: 'vus', label: 'VUs', values: ts.series.vus, color: 'var(--signal)', fill: true }],
    formatY: (v) => fmtNum(v),
    height: 160,
  });
}

function renderRpsChart(data) {
  const ts = data.timeseries;
  renderTimeSeriesChart(document.getElementById('rps-chart'), {
    timestamps: ts.timestamps,
    series: [{ id: 'rps', label: 'req/s', values: ts.series.http_reqs_rate, color: 'var(--signal)', fill: true }],
    formatY: (v) => fmtNum(v),
    height: 160,
  });
}

function renderThresholdsPreview(container, data) {
  if (!data.thresholds.length) {
    container.innerHTML = `<div class="empty-note">No thresholds configured. Add an <code>options.thresholds</code> block to your script to get pass/fail gating.</div>`;
    return;
  }
  container.innerHTML = `<div class="table-wrap"><table class="data-table"><tbody>
    ${data.thresholds.slice(0, 5).map((t) => `
      <tr>
        <td class="is-name mono">${escapeHtml(t.metric)}</td>
        <td class="mono" style="color:var(--ink-muted)">${escapeHtml(t.expr)}</td>
        <td style="text-align:right"><span class="stamp stamp--${t.ok ? 'pass' : 'fail'}">${t.ok ? 'pass' : 'fail'}</span></td>
      </tr>
    `).join('')}
  </tbody></table></div>`;
}

function renderChecksPreview(container, data) {
  if (!data.checks.total) {
    container.innerHTML = `<div class="empty-note">No checks recorded for this run.</div>`;
    return;
  }
  container.innerHTML = `
    <div class="panel" style="margin-bottom:var(--sp-3)">
      <div style="display:flex; align-items:baseline; justify-content:space-between;">
        <span class="mono" style="font-size:var(--text-2xs); text-transform:uppercase; color:var(--ink-muted)">pass rate</span>
        <span class="mono" style="font-weight:700; font-size:var(--text-lg)">${fmtPct(data.checks.rate, 1)}</span>
      </div>
    </div>
    <div class="table-wrap"><table class="data-table"><tbody>
      ${flattenChecks(data.checks.tree).slice(0, 5).map((c) => `
        <tr>
          <td class="is-name">${escapeHtml(c.name)}</td>
          <td class="is-num mono">${c.passes}/${c.passes + c.fails}</td>
          <td style="text-align:right"><span class="stamp stamp--${c.fails === 0 ? 'pass' : 'warn'}">${c.fails === 0 ? 'pass' : c.fails + ' fail'}</span></td>
        </tr>
      `).join('')}
    </tbody></table></div>
  `;
}

export function flattenChecks(node, prefix = '') {
  if (!node) return [];
  let out = [];
  const label = prefix ? prefix : '';
  for (const c of node.checks || []) out.push({ name: label ? `${label} :: ${c.name}` : c.name, passes: c.passes, fails: c.fails });
  for (const g of node.groups || []) out = out.concat(flattenChecks(g, label ? `${label} :: ${g.name}` : g.name));
  return out.sort((a, b) => b.fails - a.fails);
}

function renderSlowEndpoints(container, data) {
  const top = [...data.requestsByEndpoint].sort((a, b) => b.p95 - a.p95).slice(0, 5);
  container.innerHTML = `<div class="table-wrap"><table class="data-table"><tbody>
    ${top.map((e) => `
      <tr>
        <td><span class="method-chip">${escapeHtml(e.method)}</span></td>
        <td class="is-name">${escapeHtml(e.name)}</td>
        <td class="is-num mono">${fmtMs(e.p95)}</td>
        <td class="is-num mono ${e.failRate > 0.01 ? 'is-fail' : ''}">${fmtPct(e.failRate)}</td>
      </tr>
    `).join('')}
  </tbody></table></div>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
