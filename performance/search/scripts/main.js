import { getReportData, getHistory } from './data-loader.js';
import { initNav } from './nav.js';
import { renderOverview } from './render/overview.js';
import { renderRequests } from './render/requests.js';
import { renderChecks } from './render/checks.js';
import { renderThresholds } from './render/thresholds.js';
import { renderErrors } from './render/errors.js';
import { renderTrends } from './render/trends.js';
import { renderGlossary } from './render/glossary.js';

function boot() {
  let data, history;
  try {
    data = getReportData();
    history = getHistory();
  } catch (err) {
    document.querySelector('.main').innerHTML = `<div class="panel" style="max-width:520px; margin-top:40px;">
      <h2 style="margin-bottom:8px;">Couldn't load report data</h2>
      <p style="margin-bottom:0;">${err.message}. Make sure you're viewing this through <code>pitwall open</code> (or another local server) rather than opening the file directly, and that <code>data.js</code> sits next to <code>index.html</code>.</p>
    </div>`;
    return;
  }

  renderOverview(document.querySelector('.view[data-view="overview"]'), data, history);
  renderRequests(document.querySelector('.view[data-view="requests"]'), data);
  renderChecks(document.querySelector('.view[data-view="checks"]'), data);
  renderThresholds(document.querySelector('.view[data-view="thresholds"]'), data);
  renderErrors(document.querySelector('.view[data-view="errors"]'), data);
  renderTrends(document.querySelector('.view[data-view="trends"]'), data, history);
  renderGlossary(document.querySelector('.view[data-view="glossary"]'));

  initNav(data);

  const genEl = document.getElementById('meta-generated');
  const runEl = document.getElementById('meta-runid');
  if (genEl) genEl.textContent = new Date(data.meta.generatedAt).toLocaleString();
  if (runEl) runEl.textContent = data.meta.runId;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
