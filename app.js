"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const el = { form: $("task-form"), title: $("task-title"), desc: $("task-description"), submit: $("task-submit"),
    cancel: $("task-cancel"), list: $("task-list"), msg: $("status-message"), formTitle: $("form-title") };
  const state = { cfg: null, tasks: [], filter: "all", editingId: null, busy: false };
  let msgTimer;

  function say(text, type = "") {
    clearTimeout(msgTimer);
    el.msg.textContent = text;
    el.msg.className = type;
    if (type === "ok") msgTimer = setTimeout(() => { el.msg.textContent = ""; el.msg.className = ""; }, 3500);
  }

  async function api(query = "", options = {}) {
    const { supabaseUrl, supabasePublishableKey, tableName } = state.cfg;
    const headers = { apikey: supabasePublishableKey, "Content-Type": "application/json", Prefer: "return=representation" };
    if (supabasePublishableKey.startsWith("eyJ")) headers.Authorization = `Bearer ${supabasePublishableKey}`;
    const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${tableName}${query}`, { ...options, headers });
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).message || ""; } catch (_) {}
      throw new Error(`${res.status} ${detail}`.trim());
    }
    return res.status === 204 ? null : res.json();
  }

  async function run(label, job, success) {
    if (state.busy) return;
    state.busy = true; document.body.style.cursor = "progress";
    try { await job(); if (success) say(success, "ok"); }
    catch (err) { say(`Could not ${label}. ${err.message || "Check your connection and try again."}`, "error"); }
    finally { state.busy = false; document.body.style.cursor = ""; render(); }
  }

  const loadTasks = async () => { state.tasks = await api("?select=*&order=id.asc"); };

  function stats() {
    const total = state.tasks.length, done = state.tasks.filter((t) => t.completed).length;
    return { total, done, open: total - done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function render() {
    const s = stats();
    $("n-all").textContent = s.total; $("n-active").textContent = s.open; $("n-done").textContent = s.done;
    $("dial-pct").textContent = `${s.pct}%`;
    $("dial-sub").textContent = s.total ? `${s.done} of ${s.total} done` : "no tasks yet";
    $("dial-fill").style.strokeDashoffset = 326.73 * (1 - s.pct / 100);
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === state.filter)));

    const visible = state.tasks.filter((t) => state.filter === "all" || (state.filter === "done") === t.completed);
    el.list.replaceChildren();
    if (!visible.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = state.tasks.length ? "Nothing in this view." : "No tasks yet. Add your first one on the left.";
      el.list.append(li);
      return;
    }
    for (const t of visible) el.list.append(card(t));
    el.list.querySelectorAll("button").forEach((b) => (b.disabled = state.busy));
  }

  function make(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function card(t) {
    const li = make("li", `task-item${t.completed ? " is-done" : ""}${t.id === state.editingId ? " is-editing" : ""}`);
    li.dataset.id = t.id;
    const toggle = make("button", "toggle-task");
    toggle.type = "button";
    toggle.append(make("span", "box", "✓"), make("span", "", t.completed ? "Mark incomplete" : "Mark complete"));
    const body = make("div", "task-body");
    body.append(make("h3", "task-title", t.title), make("p", "task-description", t.description || ""),
      make("span", "task-status", t.completed ? "Completed" : "In progress"));
    const actions = make("div", "actions");
    const edit = make("button", "edit-task", "Edit"); edit.type = "button";
    const del = make("button", "delete-task", "Delete"); del.type = "button";
    actions.append(edit, del);
    li.append(toggle, body, actions);
    return li;
  }

  function resetForm() {
    state.editingId = null; el.form.reset();
    el.formTitle.textContent = "New task"; el.submit.textContent = "Add task"; el.cancel.hidden = true;
  }

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = el.title.value.trim(), description = el.desc.value.trim();
    if (!title) return say("Enter a title before saving.", "error");
    const editing = state.editingId;
    run(editing ? "save changes" : "add the task", async () => {
      if (editing) await api(`?id=eq.${editing}`, { method: "PATCH", body: JSON.stringify({ title, description }) });
      else await api("", { method: "POST", body: JSON.stringify({ title, description, completed: false }) });
      resetForm(); await loadTasks();
    }, editing ? "Changes saved." : "Task added.");
  });

  el.cancel.addEventListener("click", () => { resetForm(); render(); });

  el.list.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); const item = e.target.closest(".task-item");
    if (!btn || !item) return;
    const id = Number(item.dataset.id), task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    if (btn.classList.contains("toggle-task"))
      run("update the status", async () => { await api(`?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ completed: !task.completed }) }); await loadTasks(); },
        task.completed ? "Marked incomplete." : "Marked complete.");
    else if (btn.classList.contains("delete-task"))
      run("delete the task", async () => { await api(`?id=eq.${id}`, { method: "DELETE" }); if (state.editingId === id) resetForm(); await loadTasks(); }, "Task deleted.");
    else if (btn.classList.contains("edit-task")) {
      state.editingId = id; el.title.value = task.title; el.desc.value = task.description || "";
      el.formTitle.textContent = "Edit task"; el.submit.textContent = "Save changes"; el.cancel.hidden = false;
      render(); el.form.scrollIntoView({ behavior: "smooth", block: "nearest" }); el.title.focus();
    }
  });

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-filter]"); if (!b) return;
    state.filter = b.dataset.filter; render();
  });

  (async function init() {
    say("Loading tasks…");
    render();
    try {
      const res = await fetch("config.json", { cache: "no-cache" });
      state.cfg = await res.json();
      if (/YOUR_/.test(state.cfg.supabaseUrl + state.cfg.supabasePublishableKey)) throw new Error("Add your Supabase URL and publishable key to config.json.");
      await loadTasks(); say("");
    } catch (err) { say(`Could not load tasks. ${err.message}`, "error"); }
    render();
  })();
})();
