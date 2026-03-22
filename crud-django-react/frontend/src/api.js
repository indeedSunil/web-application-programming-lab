/* ─── Config ────────────────────────────────────────────────────────── */
const API_BASE = 'http://127.0.0.1:8000/api/tasks/';

export const api = {
  async get(filter = 'all', search = '') {
    let url = API_BASE + '?ordering=-created_at';
    if (filter === 'active')    url += '&completed=false';
    if (filter === 'completed') url += '&completed=true';
    if (search)                 url += `&search=${encodeURIComponent(search)}`;
    const r = await fetch(url); 
    if (!r.ok) throw new Error('Failed to fetch tasks');
    const data = await r.json();
    return Array.isArray(data) ? data : (data.results || []);
  },
  async create(payload) {
    const r = await fetch(API_BASE, { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body:JSON.stringify(payload) 
    });
    if (!r.ok) throw new Error('Failed to create task');
    return r.json();
  },
  async update(id, payload) {
    const r = await fetch(`${API_BASE}${id}/`, { 
      method:'PUT', 
      headers:{'Content-Type':'application/json'}, 
      body:JSON.stringify(payload) 
    });
    if (!r.ok) throw new Error('Failed to update task');
    return r.json();
  },
  async toggle(id) {
    const r = await fetch(`${API_BASE}${id}/toggle/`, { 
      method:'POST' 
    });
    if (!r.ok) throw new Error('Failed to toggle task');
    return r.json();
  },
  async remove(id) {
    const r = await fetch(`${API_BASE}${id}/`, { 
      method:'DELETE' 
    });
    if (!r.ok) throw new Error('Failed to delete task');
  },
};
