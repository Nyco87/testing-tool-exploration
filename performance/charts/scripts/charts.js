import { fmtElapsed, fmtClock } from './format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.appendChild(c);
  return node;
}

function niceTicks(max, count = 4) {
  if (!(max > 0)) return [0, 1];
  const rough = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1 * mag;
  else if (norm < 3) step = 2 * mag;
  else if (norm < 7) step = 5 * mag;
  else step = 10 * mag;
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  if (ticks.length < 2) ticks.push(step);
  return ticks;
}

function pathFor(values, xScale, yScale, timestamps) {
  let d = '';
  let open = false;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null || Number.isNaN(v)) { open = false; continue; }
    const x = xScale(timestamps[i]);
    const y = yScale(v);
    d += (open ? ' L' : ' M') + x.toFixed(1) + ',' + y.toFixed(1);
    open = true;
  }
  return d.trim();
}

/**
 * Renders a time-series chart into `container`.
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {number[]} opts.timestamps - epoch ms, aligned with each series' values array
 * @param {Array<{id:string,label:string,values:number[],color?:string,dashed?:boolean,fill?:boolean,secondary?:boolean}>} opts.series
 * @param {{value:number,label:string}} [opts.thresholdLine]
 * @param {(v:number)=>string} [opts.formatY]
 * @param {number} [opts.height]
 */
export function renderTimeSeriesChart(container, opts) {
  const {
    timestamps, series, thresholdLine, formatY = (v) => String(Math.round(v)),
    height = 220, width = 960,
    formatX = (t, t0) => '+' + fmtElapsed(t - t0),
    formatXSub = (t) => fmtClock(t),
  } = opts;

  const pad = { top: 16, right: 14, bottom: 26, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const t0 = timestamps[0];
  const t1 = timestamps[timestamps.length - 1];
  const xScale = (t) => pad.left + ((t - t0) / Math.max(1, t1 - t0)) * plotW;

  let dataMax = 0;
  for (const s of series) for (const v of s.values) if (v != null && v > dataMax) dataMax = v;
  let yMax = dataMax;
  if (thresholdLine) yMax = Math.max(yMax, thresholdLine.value * 1.12);
  if (yMax <= 0) yMax = 1;
  const ticks = niceTicks(yMax, 4);
  const axisMax = ticks[ticks.length - 1];
  const yScale = (v) => pad.top + plotH - (v / axisMax) * plotH;

  const svg = el('svg', { class: 'chart', viewBox: `0 0 ${width} ${height}`, role: 'img' });

  // grid + y labels
  for (const tick of ticks) {
    const y = yScale(tick);
    svg.appendChild(el('line', { class: 'grid-line', x1: pad.left, x2: width - pad.right, y1: y.toFixed(1), y2: y.toFixed(1) }));
    const label = el('text', { class: 'axis-label', x: pad.left - 8, y: (y + 3).toFixed(1), 'text-anchor': 'end' });
    label.textContent = formatY(tick, axisMax);
    svg.appendChild(label);
  }

  // x ticks (5 evenly spaced)
  const xTickCount = 5;
  for (let i = 0; i <= xTickCount; i++) {
    const t = t0 + ((t1 - t0) * i) / xTickCount;
    const x = xScale(t);
    svg.appendChild(el('line', { class: 'grid-line', x1: x.toFixed(1), x2: x.toFixed(1), y1: pad.top, y2: pad.top + plotH }));
    const label = el('text', { class: 'axis-label', x: x.toFixed(1), y: height - 8, 'text-anchor': i === xTickCount ? 'end' : i === 0 ? 'start' : 'middle' });
    label.textContent = formatX(t, t0);
    svg.appendChild(label);
  }

  // threshold / limit
  let thresholdY = null;
  if (thresholdLine) {
    thresholdY = yScale(thresholdLine.value);
    if (thresholdY >= pad.top && thresholdY <= pad.top + plotH) {
      svg.appendChild(el('rect', {
        class: 'limit-zone', x: pad.left, y: pad.top,
        width: plotW, height: Math.max(0, thresholdY - pad.top),
      }));
      svg.appendChild(el('line', {
        class: 'limit', x1: pad.left, x2: width - pad.right, y1: thresholdY.toFixed(1), y2: thresholdY.toFixed(1),
      }));
      const tagText = `limit · ${thresholdLine.label}`;
      const tagW = 12 + tagText.length * 5.1;
      const tagX = width - pad.right - tagW;
      const tagY = Math.max(pad.top, thresholdY - 16);
      svg.appendChild(el('rect', { class: 'limit-tag-bg', x: tagX, y: tagY, width: tagW, height: 14, rx: 2 }));
      const tag = el('text', { class: 'limit-tag', x: tagX + 6, y: tagY + 10.5 });
      tag.textContent = tagText;
      svg.appendChild(tag);
    }
  }

  // clip paths for threshold breach recoloring (used on the first series only — the "headline" trace)
  const clipId = 'clip-' + Math.random().toString(36).slice(2, 9);
  if (thresholdY != null) {
    const defs = el('defs');
    const clipBelow = el('clipPath', { id: clipId + '-under' });
    clipBelow.appendChild(el('rect', { x: pad.left, y: thresholdY, width: plotW, height: Math.max(0, pad.top + plotH - thresholdY) }));
    const clipAbove = el('clipPath', { id: clipId + '-over' });
    clipAbove.appendChild(el('rect', { x: pad.left, y: pad.top, width: plotW, height: Math.max(0, thresholdY - pad.top) }));
    defs.appendChild(clipBelow);
    defs.appendChild(clipAbove);
    svg.appendChild(defs);
  }

  series.forEach((s, idx) => {
    const d = pathFor(s.values, xScale, yScale, timestamps);
    if (!d) return;
    const color = s.color || 'var(--signal)';
    if (s.fill) {
      const fillD = fillPath(s.values, xScale, yScale, timestamps, pad.top + plotH);
      if (fillD) svg.appendChild(el('path', { d: fillD, class: idx === 0 ? 'trace-fill' : 'trace-secondary-fill' }));
    }
    const baseClass = idx === 0 ? 'trace-primary' : 'trace-secondary';
    const path = el('path', { d, class: s.dashed ? baseClass + ' trace-dashed' : baseClass });
    if (color !== 'var(--signal)' && color !== 'var(--ink-faint)') path.setAttribute('style', `stroke:${color}`);

    if (idx === 0 && thresholdY != null) {
      const under = path.cloneNode();
      under.setAttribute('clip-path', `url(#${clipId}-under)`);
      const over = path.cloneNode();
      over.removeAttribute('class');
      over.setAttribute('class', 'limit-breach-trace');
      over.setAttribute('clip-path', `url(#${clipId}-over)`);
      svg.appendChild(under);
      svg.appendChild(over);
    } else {
      svg.appendChild(path);
    }
  });

  // interactive crosshair
  const crosshairLine = el('line', { class: 'crosshair-line', y1: pad.top, y2: pad.top + plotH, x1: -100, x2: -100 });
  svg.appendChild(crosshairLine);
  const dots = series.map(() => el('circle', { class: 'crosshair-dot', r: 3, cx: -100, cy: -100 }));
  dots.forEach((d) => svg.appendChild(d));

  container.innerHTML = '';
  const surface = document.createElement('div');
  surface.className = 'chart-surface';
  surface.appendChild(svg);
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  surface.appendChild(tooltip);
  container.appendChild(surface);

  svg.addEventListener('mousemove', (ev) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const mx = (ev.clientX - rect.left) * scaleX;
    const frac = Math.min(1, Math.max(0, (mx - pad.left) / plotW));
    const idx = Math.round(frac * (timestamps.length - 1));
    const t = timestamps[idx];
    const x = xScale(t);
    crosshairLine.setAttribute('x1', x.toFixed(1));
    crosshairLine.setAttribute('x2', x.toFixed(1));

    let rows = '';
    series.forEach((s, i) => {
      const v = s.values[idx];
      if (v == null) { dots[i].setAttribute('cx', -100); return; }
      const y = yScale(v);
      dots[i].setAttribute('cx', x.toFixed(1));
      dots[i].setAttribute('cy', y.toFixed(1));
      rows += `<div class="chart-tooltip__row"><span class="chart-tooltip__label">${s.label}</span><span>${formatY(v)}</span></div>`;
    });
    tooltip.innerHTML = `<div class="chart-tooltip__row"><strong>${formatX(t, t0)}</strong><span class="chart-tooltip__label">${formatXSub(t)}</span></div>${rows}`;
    tooltip.classList.add('is-visible');
    const wrapRect = surface.getBoundingClientRect();
    const px = (x / width) * wrapRect.width;
    tooltip.style.left = Math.min(wrapRect.width - 150, Math.max(0, px + 10)) + 'px';
    tooltip.style.top = '8px';
  });
  svg.addEventListener('mouseleave', () => {
    tooltip.classList.remove('is-visible');
    crosshairLine.setAttribute('x1', -100);
    crosshairLine.setAttribute('x2', -100);
    dots.forEach((d) => d.setAttribute('cx', -100));
  });

  return svg;
}

function fillPath(values, xScale, yScale, timestamps, baseline) {
  let top = '';
  let open = false;
  let firstX = null, lastX = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null) continue;
    const x = xScale(timestamps[i]);
    const y = yScale(v);
    if (firstX == null) firstX = x;
    lastX = x;
    top += (open ? ' L' : ' M') + x.toFixed(1) + ',' + y.toFixed(1);
    open = true;
  }
  if (!open) return '';
  return `${top} L${lastX.toFixed(1)},${baseline.toFixed(1)} L${firstX.toFixed(1)},${baseline.toFixed(1)} Z`;
}

/** Small inline sparkline, e.g. for stat tiles or the Trends run table. */
export function renderSparkline(values, { width = 90, height = 28, color = 'var(--signal)', fail = false } = {}) {
  const svg = el('svg', { class: 'spark', viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none' });
  const nums = values.filter((v) => v != null);
  if (!nums.length) return svg;
  const min = Math.min(...nums), max = Math.max(...nums);
  const range = max - min || 1;
  const xScale = (i) => (i / (values.length - 1 || 1)) * (width - 4) + 2;
  const yScale = (v) => height - 3 - ((v - min) / range) * (height - 6);
  let d = '';
  let open = false;
  values.forEach((v, i) => {
    if (v == null) { open = false; return; }
    d += (open ? ' L' : ' M') + xScale(i).toFixed(1) + ',' + yScale(v).toFixed(1);
    open = true;
  });
  svg.appendChild(el('path', { d, class: fail ? 'spark-line spark-fail-line' : 'spark-line' }));
  return svg;
}
