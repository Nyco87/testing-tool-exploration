/**
 * Renders a sortable table.
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {Array<{key,label,align,numeric,format,cellClass}>} opts.columns
 * @param {Array<object>} opts.rows
 * @param {string} [opts.defaultSort] - column key
 * @param {'asc'|'desc'} [opts.defaultDir]
 * @param {(row)=>string} [opts.rowClass]
 * @param {boolean} [opts.searchable]
 * @param {(row,query)=>boolean} [opts.searchPredicate]
 */
export function renderTable(container, opts) {
  const { columns, rows, defaultSort, defaultDir = 'desc', rowClass, searchable, searchPredicate } = opts;
  let sortKey = defaultSort || columns[0].key;
  let sortDir = defaultDir;
  let query = '';

  const wrap = document.createElement('div');

  if (searchable) {
    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';
    const input = document.createElement('input');
    input.className = 'search-input';
    input.type = 'text';
    input.placeholder = 'Filter…';
    input.addEventListener('input', () => { query = input.value.trim().toLowerCase(); paint(); });
    const count = document.createElement('div');
    count.className = 'table-count';
    toolbar.appendChild(input);
    toolbar.appendChild(count);
    wrap.appendChild(toolbar);
    wrap._count = count;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'data-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach((col) => {
    const th = document.createElement('th');
    th.className = col.numeric ? 'is-num' : '';
    th.innerHTML = `${col.label}<span class="caret">${'\u25BE'}</span>`;
    th.addEventListener('click', () => {
      if (sortKey === col.key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = col.key; sortDir = col.numeric ? 'desc' : 'asc'; }
      paint();
    });
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);
  container.innerHTML = '';
  container.appendChild(wrap);

  function paint() {
    let data = rows;
    if (query) {
      data = data.filter((r) => (searchPredicate ? searchPredicate(r, query) : JSON.stringify(r).toLowerCase().includes(query)));
    }
    data = [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      let cmp;
      if (typeof av === 'string' || typeof bv === 'string') cmp = String(av).localeCompare(String(bv));
      else cmp = (av ?? -Infinity) - (bv ?? -Infinity);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    headRow.querySelectorAll('th').forEach((th, i) => {
      th.classList.toggle('is-sorted', columns[i].key === sortKey);
      th.querySelector('.caret').textContent = columns[i].key === sortKey ? (sortDir === 'asc' ? '\u25B4' : '\u25BE') : '\u25BE';
    });

    tbody.innerHTML = '';
    if (!data.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = columns.length;
      td.className = 'empty-note';
      td.textContent = 'No matching rows.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    for (const row of data) {
      const tr = document.createElement('tr');
      if (rowClass) tr.className = rowClass(row) || '';
      columns.forEach((col) => {
        const td = document.createElement('td');
        td.className = [col.numeric ? 'is-num' : '', col.cellClass ? col.cellClass(row) : ''].filter(Boolean).join(' ');
        const val = row[col.key];
        // format() output is trusted HTML (formatters escape data themselves);
        // unformatted values are raw data and must not reach innerHTML.
        if (col.format) td.innerHTML = col.format(val, row);
        else td.textContent = val ?? '—';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    if (wrap._count) wrap._count.textContent = `${data.length} of ${rows.length}`;
  }

  paint();
  return { repaint: paint };
}
