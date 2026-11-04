/* Task Manager — plain JavaScript + Supabase REST API (PostgREST)
   Author: Ominakavsar Abduganieva · Student ID 74026 */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const form = $('#task-form');
  const titleInput = $('#task-title');
  const descInput = $('#task-description');
  const submitBtn = $('#task-submit');
  const cancelBtn = $('#task-cancel');
  const listEl = $('#task-list');
  const statusEl = $('#status-message');
  const emptyEl = $('#empty-state');

  const state = { tasks: [], filter: 'all', editingId: null, api: null, busy: false };
  let statusTimer;

  /* ---------- helpers ---------- */
  function setStatus(msg, type = '') {
    clearTimeout(statusTimer);
    statusEl.textContent = msg;
    statusEl.className = 'status ' + (type ? 'is-' + type : '');
    if (msg && type === 'ok') statusTimer = setTimeout(() => setStatus(''), 3500);
  }

  async function loadConfig() {
    const res = await fetch('config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Cannot load config.json (HTTP ' + res.status + ')');
    const cfg = await res.json();
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey || cfg.supabaseUrl.includes('YOUR_PROJECT')) {
      throw new Error('config.json is not configured yet — add your Supabase URL and publishable key.');
    }
    const base = cfg.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/' + (cfg.tableName || 'tasks');
    state.api = {
      base,
      headers: {
        apikey: cfg.supabasePublishableKey,
        'Content-Type': 'application/json'
      }
    };
  }

  async function request(path, { method = 'GET', body, returning = false } = {}) {
    const headers = { ...state.api.headers };
    if (returning) headers.Prefer = 'return=representation';
    let res;
    try {
      res = await fetch(state.api.base + path, {
        method, headers, body: body ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new Error('Network error — check your connection.');
    }
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch { /* ignore */ }
      throw new Error('Request failed (' + res.status + ')' + (detail ? ': ' + detail : ''));
    }
    return res.status === 204 ? null : res.json().catch(() => null);
  }

  /* ---------- API operations ---------- */
  const api = {
    list:   () => request('?select=*&order=id.asc'),
    create: (t) => request('', { method: 'POST', body: t, returning: true }),
    update: (id, patch) => request('?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: patch, returning: true }),
    remove: (id) => request('?id=eq.' + encodeURIComponent(id), { method: 'DELETE' })
  };

  /* ---------- rendering ---------- */
  function render() {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    $('#progress-pct').textContent = pct + '%';
    $('#progress-count').textContent = done + ' of ' + total + ' done';
    $('#progress-ring').style.strokeDashoffset = String(113.1 * (1 - pct / 100));

    const visible = state.tasks.filter((t) =>
      state.filter === 'all' ? true : state.filter === 'done' ? t.completed : !t.completed);

    listEl.replaceChildren(...visible.map(buildItem));
    emptyEl.hidden = visible.length > 0;
    if (!visible.length && total) emptyEl.textContent = 'No tasks match this filter.';
    else emptyEl.textContent = 'Nothing here yet — your first entry starts the ledger.';
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function buildItem(t) {
    const item = el('article', 'task-item' + (t.completed ? ' is-done' : '') + (t.id === state.editingId ? ' is-editing' : ''));
    item.dataset.id = t.id;

    const body = el('div');
    body.style.gridColumn = '2';
    body.append(
      el('h3', 'task-title', t.title),
      el('p', 'task-description', t.description || ''),
      el('span', 'task-status' + (t.completed ? ' is-done' : ''), t.completed ? 'Completed' : 'In progress')
    );

    const actions = el('div', 'task-actions');
    actions.append(
      el('button', 'toggle-task', t.completed ? 'Mark incomplete' : 'Mark complete'),
      el('button', 'edit-task', 'Edit'),
      el('button', 'delete-task', 'Delete')
    );
    actions.querySelectorAll('button').forEach((b) => (b.type = 'button'));
    body.append(actions);
    item.append(body);
    return item;
  }

  function skeletons() {
    listEl.replaceChildren(...[1, 2, 3].map(() => el('div', 'skeleton')));
  }

  /* ---------- actions ---------- */
  async function refresh() {
    state.tasks = (await api.list()) || [];
    render();
  }

  function resetForm() {
    state.editingId = null;
    form.reset();
    submitBtn.textContent = 'Add task';
    cancelBtn.hidden = true;
  }

  async function guarded(fn, okMsg) {
    if (state.busy) return;
    state.busy = true;
    submitBtn.disabled = true;
    try {
      await fn();
      if (okMsg) setStatus(okMsg, 'ok');
    } catch (e) {
      setStatus('⚠ ' + e.message, 'error');
    } finally {
      state.busy = false;
      submitBtn.disabled = false;
    }
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    if (!title) return setStatus('⚠ Title is required.', 'error');

    const editing = state.editingId;
    guarded(async () => {
      if (editing !== null) await api.update(editing, { title, description });
      else await api.create({ title, description, completed: false });
      resetForm();
      await refresh();
    }, editing !== null ? 'Task updated.' : 'Task added.');
  });

  cancelBtn.addEventListener('click', () => { resetForm(); render(); setStatus(''); });

  listEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    const item = ev.target.closest('.task-item');
    if (!btn || !item) return;
    const id = Number(item.dataset.id);
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    if (btn.classList.contains('toggle-task')) {
      guarded(async () => {
        await api.update(id, { completed: !task.completed });
        await refresh();
      }, task.completed ? 'Marked as incomplete.' : 'Marked as completed.');
    } else if (btn.classList.contains('edit-task')) {
      state.editingId = id;
      titleInput.value = task.title;
      descInput.value = task.description || '';
      submitBtn.textContent = 'Save changes';
      cancelBtn.hidden = false;
      render();
      titleInput.focus();
      setStatus('Editing — change the fields and save.');
    } else if (btn.classList.contains('delete-task')) {
      if (!confirm('Delete “' + task.title + '”?')) return;
      guarded(async () => {
        await api.remove(id);
        if (state.editingId === id) resetForm();
        await refresh();
      }, 'Task deleted.');
    }
  });

  document.querySelectorAll('.chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      state.filter = chip.dataset.filter;
      document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
      render();
    }));

  /* ---------- boot ---------- */
  (async function init() {
    skeletons();
    try {
      await loadConfig();
      await refresh();
    } catch (e) {
      listEl.replaceChildren();
      render();
      setStatus('⚠ ' + e.message, 'error');
    }
  })();
})();
