export function getReportData() {
  const d = window.__PITWALL_DATA__;
  if (!d) throw new Error('No report data found (data.js did not load).');
  return d;
}

export function getHistory() {
  return window.__PITWALL_HISTORY__ || [];
}
