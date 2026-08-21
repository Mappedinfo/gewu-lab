// visual-sage — pure-static frontend. SymPy runs in-browser via Pyodide (WASM).
// templates.py is the single source of truth: fetched as text, exec'd in Pyodide.

const PYODIDE_VERSION = "v0.27.2";
const state = { templates: [], current: null, py: null, ready: false };

const $list = document.getElementById('template-list');
const $ws = document.getElementById('workspace');
const $badge = document.getElementById('engine-badge');
const $search = document.getElementById('search');
const $overlay = document.getElementById('overlay');
const $overlayMsg = document.getElementById('overlay-msg');
const $bootMsg = document.getElementById('boot-msg');

async function boot() {
  try {
    $overlayMsg.textContent = '下载 Pyodide 运行时…';
    state.py = await loadPyodide();
    $overlayMsg.textContent = '加载 SymPy 包（首次较大）…';
    await state.py.loadPackage('sympy');
    $overlayMsg.textContent = '加载任务模板…';
    const src = await fetch('./templates.py').then(r => r.text());
    await state.py.runPythonAsync(src);
    const json = state.py.runPython('import json; json.dumps(list_templates_json())');
    state.templates = JSON.parse(json);
    state.ready = true;
    $badge.textContent = `引擎：Pyodide + SymPy（浏览器内）`;
    $search.disabled = false;
    hideOverlay();
    renderSidebar('');
    if (state.templates.length) select(state.templates[0].id);
  } catch (e) {
    $overlayMsg.innerHTML = `<span style="color:var(--err)">引擎启动失败：</span>${String(e)}`;
    if ($bootMsg) $bootMsg.textContent = '引擎启动失败：' + String(e);
  }
}

function showOverlay(msg) { $overlayMsg.textContent = msg; $overlay.style.display = 'grid'; }
function hideOverlay() { $overlay.style.display = 'none'; }

$search.addEventListener('input', () => renderSidebar($search.value.trim().toLowerCase()));

function renderSidebar(query) {
  const byCat = {};
  for (const t of state.templates) {
    if (query && !(t.name.toLowerCase().includes(query) || t.id.toLowerCase().includes(query)
        || t.category.toLowerCase().includes(query))) continue;
    (byCat[t.category] = byCat[t.category] || []).push(t);
  }
  const order = ['数论', '群论', '交换代数', '线性代数', '格'];
  const cats = [...Object.keys(byCat)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  $list.innerHTML = cats.map(cat => `
    <div class="cat">
      <div class="cat-title">${escapeHtml(cat)}</div>
      ${byCat[cat].map(t => `
        <div class="tpl-item ${state.current === t.id ? 'active' : ''}" data-id="${t.id}">
          <span class="name">${escapeHtml(t.name)}</span>
          ${t.needs_engine !== 'sympy' ? `<span class="tag tag-gap" title="${escapeHtml(t.note||'')}">需 ${escapeHtml(t.needs_engine)}</span>` : ''}
        </div>`).join('')}
    </div>`).join('');
  $list.querySelectorAll('.tpl-item').forEach(el => {
    el.addEventListener('click', () => select(el.dataset.id));
  });
}

function select(id) {
  const t = state.templates.find(x => x.id === id);
  if (!t) return;
  state.current = id;
  renderSidebar($search.value.trim().toLowerCase());
  renderForm(t);
}

function renderForm(t) {
  const fields = t.params.map(p => {
    const full = (p.type === 'matrix' || p.type === 'intlist') ? ' full' : '';
    return `<div class="field${full}">
      <label>${escapeHtml(p.label)} <span style="color:var(--text-mute);font-family:var(--mono);">[${p.type}]</span></label>
      ${controlHtml(p)}
      ${p.hint ? `<span class="hint">${escapeHtml(p.hint)}</span>` : ''}
    </div>`;
  }).join('');

  $ws.innerHTML = `
    <div class="tpl-header">
      <div class="cat-pill">${escapeHtml(t.category)} · ${escapeHtml(t.id)}</div>
      <h2>${escapeHtml(t.name)}</h2>
      <p>${escapeHtml(t.description)}</p>
      ${t.note ? `<div class="tpl-note">⚠ ${escapeHtml(t.note)}</div>` : ''}
    </div>
    <div class="form-grid">${fields}</div>
    <div class="actions">
      <button class="btn-run" id="run-btn">运行 ▸</button>
      <span class="run-status" id="run-status"></span>
    </div>
    <div class="panes" id="panes" style="display:none;">
      <div class="pane">
        <div class="pane-head"><span>生成的代码 (SymPy)</span><span id="code-meta"></span></div>
        <div class="pane-body"><pre class="code-mirror" id="code-out"></pre></div>
      </div>
      <div class="pane">
        <div class="pane-head"><span>结果</span><span id="res-meta"></span></div>
        <div class="pane-body"><pre id="res-out"></pre></div>
      </div>
    </div>`;

  document.getElementById('run-btn').addEventListener('click', () => run(t));
}

function controlHtml(p) {
  const v = escapeHtml(String(p.default ?? ''));
  if (p.type === 'enum') {
    return `<select data-name="${p.name}">${p.options.map(o =>
      `<option value="${escapeHtml(o)}" ${o === p.default ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select>`;
  }
  if (p.type === 'matrix' || p.type === 'intlist') {
    return `<textarea data-name="${p.name}">${v}</textarea>`;
  }
  return `<input data-name="${p.name}" type="text" value="${v}">`;
}

async function run(t) {
  const btn = document.getElementById('run-btn');
  const status = document.getElementById('run-status');
  const panes = document.getElementById('panes');
  const codeOut = document.getElementById('code-out');
  const resOut = document.getElementById('res-out');
  const resMeta = document.getElementById('res-meta');
  btn.disabled = true;
  status.textContent = '计算中…';
  panes.style.display = 'grid';
  resOut.className = '';

  const params = {};
  $ws.querySelectorAll('[data-name]').forEach(el => { params[el.dataset.name] = el.value; });

  // Capability gate (client-side): no faking results for gap-only tasks.
  const canRun = state.py.runPython(`can_run(${JSON.stringify(t.id)})`);
  if (!canRun) {
    codeOut.textContent = genOnly(t.id, params);
    resOut.classList.add('result-unsupported');
    resOut.textContent = '⏸ ' + (t.note || `此任务需要 ${t.needs_engine} 引擎，当前浏览器内 SymPy 引擎不支持。`);
    resMeta.textContent = 'engine gap';
    btn.disabled = false;
    status.textContent = '';
    return;
  }

  codeOut.textContent = genOnly(t.id, params);
  document.getElementById('code-meta').textContent = '@pyodide/sympy';

  const chunks = [];
  state.py.setStdout({ batched: s => chunks.push(s) });
  state.py.setStderr({ batched: s => chunks.push(s) });
  try {
    state.py.globals.set('_params', _paramsToPy(params));
    const t0 = performance.now();
    await state.py.runPythonAsync(`exec(runnable_code(${JSON.stringify(t.id)}, _params))`);
    const dur = ((performance.now() - t0) / 1000).toFixed(2);
    resOut.textContent = chunks.join('\n') || '(空输出)';
    resMeta.textContent = `ok · ${dur}s`;
    status.textContent = '完成。';
  } catch (e) {
    resOut.classList.add('result-err');
    resOut.textContent = (chunks.join('\n') || '') + '\n✗ ' + String(e);
    resMeta.textContent = 'error';
  } finally {
    btn.disabled = false;
  }
}

function genOnly(id, params) {
  state.py.globals.set('_params', _paramsToPy(params));
  return state.py.runPython(`gen_only(${JSON.stringify(id)}, _params)`);
}

// Pass form params (all strings) into Pyodide as a Python dict.
function _paramsToPy(params) {
  // Explicit conversion: a raw JS object set as a global becomes a JsProxy
  // (which has no .get()), not a dict. toPy() yields a real Python dict.
  return state.py.toPy(params);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

boot();
