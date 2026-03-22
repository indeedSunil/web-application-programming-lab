import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import './index.css';

/* ─── Helpers ───────────────────────────────────────────────────────── */
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── Toast Hook ────────────────────────────────────────────────────── */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

/* ─── Stats Bar ─────────────────────────────────────────────────────── */
function StatsBar({ tasks }) {
  const total     = tasks.length;
  const done      = tasks.filter(t => t.completed).length;
  const pending   = total - done;
  return (
    <div className="stats-bar">
      <div className="stat-card"><div className="stat-num">{total}</div><div className="stat-label">Total Tasks</div></div>
      <div className="stat-card"><div className="stat-num">{pending}</div><div className="stat-label">Pending</div></div>
      <div className="stat-card"><div className="stat-num">{done}</div><div className="stat-label">Completed</div></div>
    </div>
  );
}

/* ─── Create / Edit Form ────────────────────────────────────────────── */
function TaskForm({ onCreated, toast }) {
  const [form, setForm] = useState({ title:'', description:'', priority:'medium' });
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { toast('Please enter a task title.', 'error'); return; }
    setSaving(true);
    try {
      const task = await api.create({ ...form, completed: false });
      onCreated(task);
      setForm({ title:'', description:'', priority:'medium' });
      titleRef.current?.focus();
      toast('✅ Task created!', 'success');
    } catch (err) {
      toast('❌ ' + err.message, 'error');
    } finally { setSaving(false); }
  }

  return (
    <div className="form-card">
      <h2><span className="icon">✦</span> Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-row">
            <div>
              <label>Task Title *</label>
              <input ref={titleRef} type="text" placeholder="What needs to be done?" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>
          <div>
            <label>Description (optional)</label>
            <textarea placeholder="Add details, notes, or context…" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? '⏳ Saving…' : '＋ Add Task'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setForm({ title:'', description:'', priority:'medium' })}>
              Clear
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Inline Edit Form ──────────────────────────────────────────────── */
function EditForm({ task, onSaved, onCancel, toast }) {
  const [form, setForm] = useState({ title: task.title, description: task.description, priority: task.priority });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) { toast('Title cannot be empty.', 'error'); return; }
    setSaving(true);
    try {
      const updated = await api.update(task.id, { ...form, completed: task.completed });
      onSaved(updated);
      toast('📝 Task updated!', 'success');
    } catch (err) {
      toast('❌ ' + err.message, 'error');
    } finally { setSaving(false); }
  }

  return (
    <div className="task-edit-form">
      <div className="form-row">
        <div>
          <label>Title</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
        </div>
        <div>
          <label>Priority</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>
      </div>
      <div>
        <label>Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="task-edit-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '⏳ Saving…' : '💾 Save'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── Task Card ─────────────────────────────────────────────────────── */
function TaskCard({ task, onToggle, onDelete, onUpdate, toast }) {
  const [editing,  setEditing]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      const updated = await api.toggle(task.id);
      onToggle(updated);
      toast(updated.completed ? '✅ Marked complete!' : '↩️ Marked active', 'info');
    } catch (err) { toast('❌ ' + err.message, 'error'); }
    finally { setToggling(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.remove(task.id);
      onDelete(task.id);
      toast('🗑️ Task deleted', 'info');
    } catch (err) { 
      toast('❌ ' + err.message, 'error'); 
      setDeleting(false);
    }
  }

  return (
    <div className={`task-card priority-${task.priority} ${task.completed ? 'completed-card' : ''}`}>
      {/* Checkbox */}
      <div
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={handleToggle}
        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {toggling ? '⏳' : task.completed ? '✓' : ''}
      </div>

      {/* Body */}
      <div className="task-body">
        {editing ? (
          <EditForm
            task={task}
            onSaved={updated => { onUpdate(updated); setEditing(false); }}
            onCancel={() => setEditing(false)}
            toast={toast}
          />
        ) : (
          <>
            <div className="task-title">{task.title}</div>
            {task.description && <div className="task-desc">{task.description}</div>}
            <div className="task-meta">
              <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
              <span className="task-date">📅 {fmtDate(task.created_at)}</span>
              {task.completed && <span className="task-date">🏁 Done</span>}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="task-actions">
          {confirmDelete ? (
            <>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginRight: '6px', display: 'flex', alignItems: 'center' }}>Delete?</span>
              <button className="btn-icon danger" title="Confirm Delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? '⏳' : '✓'}
              </button>
              <button className="btn-icon" title="Cancel" onClick={() => setConfirmDelete(false)}>✗</button>
            </>
          ) : (
            <>
              <button className="btn-icon success" title="Edit" onClick={() => setEditing(true)}>✏️</button>
              <button className="btn-icon danger"  title="Delete" onClick={() => setConfirmDelete(true)}>
                🗑️
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Toasts ─────────────────────────────────────────────────────────── */
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────────────────────── */
function App() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const { toasts, show: toast } = useToasts();
  const searchTimer = useRef(null);

  const loadTasks = useCallback(async (f = filter, s = search) => {
    setLoading(true); setError('');
    try {
      const data = await api.get(f, s);
      setTasks(data);
    } catch (err) {
      setError(err.message + ' — Make sure the Django server is running on port 8000.');
    } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { loadTasks(filter, search); }, [filter]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadTasks(filter, search), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const handleCreated = task => setTasks(t => [task, ...t]);
  const handleToggle  = updated => setTasks(t => t.map(x => x.id === updated.id ? updated : x));
  const handleUpdate  = updated => setTasks(t => t.map(x => x.id === updated.id ? updated : x));
  const handleDelete  = id => setTasks(t => t.filter(x => x.id !== id));

  const filterChange = f => { setFilter(f); };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">✦</div>
          <h1>TaskFlow</h1>
        </div>
        <p>Full-Stack CRUD — Django REST Framework + React JS</p>
        <div className="tech-badges">
          <span className="badge badge-drf">Django REST Framework</span>
          <span className="badge badge-react">React 18</span>
          <span className="badge badge-rest">REST API</span>
        </div>
      </header>

      {/* Stats */}
      <StatsBar tasks={tasks} />

      {/* Create Form */}
      <TaskForm onCreated={handleCreated} toast={toast} />

      {/* Filters */}
      <div className="filters-row">
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍  Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all','active','completed'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => filterChange(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="loader-wrap">
          <div className="loading-spinner" />
          <p>Fetching tasks from API…</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{search ? '🔍' : '📋'}</div>
          <h3>{search ? 'No tasks match your search' : 'No tasks yet!'}</h3>
          <p>{search ? 'Try a different keyword.' : 'Add your first task above to get started.'}</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              toast={toast}
            />
          ))}
        </div>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default App;
