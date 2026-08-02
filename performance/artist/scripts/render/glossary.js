const PHASES = [
  { key: 'blocked', label: 'Blocked', pct: 3, color: '#a4a79d', metric: 'http_req_blocked' },
  { key: 'connecting', label: 'Connecting', pct: 5, color: '#7a9db5', metric: 'http_req_connecting' },
  { key: 'tls', label: 'TLS handshake', pct: 8, color: '#5c86a3', metric: 'http_req_tls_handshaking' },
  { key: 'sending', label: 'Sending', pct: 2, color: '#8fb59c', metric: 'http_req_sending' },
  { key: 'waiting', label: 'Waiting (TTFB)', pct: 65, color: '#1f5c7a', metric: 'http_req_waiting' },
  { key: 'receiving', label: 'Receiving', pct: 17, color: '#3f7d53', metric: 'http_req_receiving' },
];

const METRICS = [
  {
    name: 'http_req_duration', type: 'trend', unit: 'ms',
    short: 'Total time for the request, start to finish.',
    body: "This is the number most people mean when they say \u201cresponse time.\u201d It's the sum of every phase below \u2014 blocked, connecting, TLS handshake, sending, waiting, and receiving. When someone asks \u201chow fast is the API,\u201d this is usually the metric to reach for, typically at its p95 or p99, not its average.",
  },
  {
    name: 'http_req_blocked', type: 'trend', unit: 'ms',
    short: 'Time waiting for a free connection slot, plus DNS lookup.',
    body: 'This is queueing time before the request could even start. High values usually point to too many concurrent connections competing for a limited pool on the client side \u2014 not a slow server.',
  },
  {
    name: 'http_req_connecting', type: 'trend', unit: 'ms',
    short: 'Time spent establishing the TCP connection.',
    body: "Zero if an existing connection was reused via keep-alive, which is the common case after the first request to a host. Consistently non-zero values across many requests can mean connection reuse isn't working the way you expect.",
  },
  {
    name: 'http_req_tls_handshaking', type: 'trend', unit: 'ms',
    short: 'Time spent on the TLS handshake, for HTTPS requests.',
    body: 'Zero for plain HTTP or for requests that reused an existing TLS session. Consistently high values can point to certificate chain issues or a server doing expensive handshake work per connection.',
  },
  {
    name: 'http_req_sending', type: 'trend', unit: 'ms',
    short: 'Time spent sending the request data to the server.',
    body: 'Usually tiny for typical JSON payloads. Grows with request body size or a slow upload path.',
  },
  {
    name: 'http_req_waiting', type: 'trend', unit: 'ms',
    short: 'Time to first byte (TTFB) \u2014 waiting for the server to respond.',
    body: "Often the most useful single number for \u201chow slow is the server itself,\u201d since it excludes network transfer time on either side. If http_req_duration is high but http_req_waiting is low, look at the network or response size, not your application code.",
  },
  {
    name: 'http_req_receiving', type: 'trend', unit: 'ms',
    short: 'Time spent receiving the response body.',
    body: 'Grows with response size and slow client-side network conditions. Large payloads or uncompressed responses show up here.',
  },
  {
    name: 'http_req_failed', type: 'rate', unit: '%',
    short: 'Share of requests k6 considers failed.',
    body: "By default, non-2xx/3xx status codes and network errors. You can override what counts as a failure with a custom response callback. This is usually the metric behind an \u201cerror rate\u201d threshold.",
  },
  {
    name: 'http_reqs', type: 'counter', unit: 'count',
    short: 'Total number of HTTP requests made.',
    body: 'A straightforward count, usually read as a rate (requests/second) to describe throughput.',
  },
  {
    name: 'iterations', type: 'counter', unit: 'count',
    short: 'Number of times the default function ran to completion.',
    body: "One iteration is typically one simulated user session \u2014 everything inside your script's default function, from the first request to the last.",
  },
  {
    name: 'iteration_duration', type: 'trend', unit: 'ms',
    short: 'How long one full iteration took.',
    body: 'Includes every request in the iteration plus any sleep() calls between them. This is closer to "how long did one simulated user session take" than http_req_duration is.',
  },
  {
    name: 'dropped_iterations', type: 'counter', unit: 'count',
    short: "Iterations k6 planned to run but couldn't.",
    body: "Only relevant with arrival-rate executors (constant-arrival-rate, ramping-arrival-rate). A non-zero count means there weren't enough VUs pre-allocated to keep up with the arrival rate you asked for \u2014 treat your throughput numbers with suspicion until this is zero, since the test undersold the load you configured.",
  },
  {
    name: 'vus', type: 'gauge', unit: 'count',
    short: 'Number of virtual users actively running right now.',
    body: 'Rises and falls as your test ramps up and down. This is the live count, not the configured target.',
  },
  {
    name: 'vus_max', type: 'gauge', unit: 'count',
    short: 'Peak number of virtual users allocated.',
    body: "The highest amount of VU capacity k6 set aside during the test. Can be higher than the peak of vus itself, since k6 sometimes pre-allocates VUs before it needs to use them all.",
  },
  {
    name: 'data_sent', type: 'counter', unit: 'bytes',
    short: 'Total bytes sent to the server.',
    body: 'Useful for estimating bandwidth cost and for sanity-checking that requests are shaped the way you expect.',
  },
  {
    name: 'data_received', type: 'counter', unit: 'bytes',
    short: 'Total bytes received from the server.',
    body: 'Large or unexpectedly growing values often point to uncompressed responses or a payload that grew over the course of the test.',
  },
  {
    name: 'checks', type: 'rate', unit: '%',
    short: 'Pass/fail count for every check() assertion in the script.',
    body: "Purely informational. A failed check is recorded but never stops the test or changes k6's exit code \u2014 see \u201cChecks vs thresholds\u201d below.",
  },
  {
    name: 'group_duration', type: 'trend', unit: 'ms',
    short: 'Total time inside a named group() block.',
    body: 'Includes every request and sub-group nested inside it. Useful for timing a multi-step flow (e.g. "checkout") as one unit instead of summing individual requests by hand.',
  },
];

export function renderGlossary(container) {
  const w = document.createElement('div');
  w.innerHTML = `
    <div class="view__header">
      <div>
        <span class="view__eyebrow">Reference</span>
        <h1 class="view__title">What each metric means</h1>
        <div class="view__subtitle">k6 emits four kinds of metrics: <strong>trend</strong> (a distribution of values, like durations), <strong>counter</strong> (a running total), <strong>gauge</strong> (the latest value of something that goes up and down), and <strong>rate</strong> (the percentage of values that were non-zero, like pass/fail checks).</div>
      </div>
    </div>

    <div class="section">
      <div class="section__head"><div class="section__title">Anatomy of a request</div><div class="section__note">how http_req_duration breaks down</div></div>
      <div class="panel">
        <div class="phase-bar">
          ${PHASES.map((p) => `<div class="phase-bar__seg" style="width:${p.pct}%; background:${p.color};">${p.pct >= 6 ? p.pct + '%' : ''}</div>`).join('')}
        </div>
        <div class="phase-legend">
          ${PHASES.map((p) => `<span class="phase-legend__item"><span class="phase-legend__swatch" style="background:${p.color}"></span>${p.label} <span class="mono" style="color:var(--ink-faint)">(${p.metric})</span></span>`).join('')}
        </div>
        <p style="margin-top: var(--sp-4); font-size: var(--text-sm);">Proportions shown are typical for a simple HTTPS API call on a warm connection \u2014 your own test's <a href="#requests">endpoint table</a> has the real breakdown. <strong>http_req_duration</strong> is the sum of all six phases.</p>
      </div>
    </div>

    <div class="section">
      <div class="section__head"><div class="section__title">Understanding percentiles</div></div>
      <div class="panel">
        <p style="font-size: var(--text-sm); max-width: 74ch;">A percentile tells you what fraction of requests were <em>at or below</em> a value. If <span class="mono">http_req_duration</span>'s p95 is 320&nbsp;ms, then 95% of requests finished in 320&nbsp;ms or less \u2014 and the slowest 5% took longer than that.</p>
        <p style="font-size: var(--text-sm); max-width: 74ch; margin-bottom:0;">Percentiles matter more than averages for judging user experience, because an average can look perfectly healthy while a meaningful slice of real users are having a slow, frustrating time. p95 and p99 are where that slice shows up. That's why thresholds are almost always written against a percentile, not an average.</p>
      </div>
    </div>

    <div class="section">
      <div class="section__head"><div class="section__title">Checks vs. thresholds</div></div>
      <div class="two-col">
        <div class="panel">
          <div class="panel__label" style="margin-bottom:8px;">check()</div>
          <p style="font-size: var(--text-sm);">A per-response assertion, like "was the status 200" or "did the body contain a token." Checks are informational: a failed check is recorded on the <a href="#checks">Checks page</a>, but it never stops the test or changes the exit code. Good for spot-checking correctness throughout a run.</p>
        </div>
        <div class="panel">
          <div class="panel__label" style="margin-bottom:8px;">thresholds</div>
          <p style="font-size: var(--text-sm); margin-bottom:0;">A pass/fail gate on an aggregate metric across the <em>whole</em> test \u2014 e.g. "p95 duration must stay under 500ms." Thresholds are the only thing that sets k6's exit code, which is what makes them useful as a CI gate. See the <a href="#thresholds">Thresholds page</a> for this run's results.</p>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section__head"><div class="section__title">Metric reference</div></div>
      <div id="metric-list"></div>
    </div>
  `;
  container.innerHTML = '';
  container.appendChild(w);

  document.getElementById('metric-list').innerHTML = METRICS.map((m) => `
    <div class="panel" style="margin-bottom: var(--sp-3);">
      <div style="display:flex; align-items:baseline; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
        <span class="mono" style="font-weight:700; font-size: var(--text-md);">${m.name}</span>
        <span class="stamp stamp--neutral">${m.type}</span>
      </div>
      <p style="font-size: var(--text-sm); font-weight:600; color:var(--ink); margin-bottom:4px;">${m.short}</p>
      <p style="font-size: var(--text-sm); margin-bottom:0;">${m.body}</p>
    </div>
  `).join('');
}
