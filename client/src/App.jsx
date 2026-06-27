import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api';
const defaultHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function App() {
  const [leads, setLeads] = useState([]);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ username: '', password: '' });
  const [form, setForm] = useState({ name: '', email: '', source: 'Website', status: 'new', company: '', note: '' });
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = useMemo(() => !!localStorage.getItem('crm_token'), []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchLeads();
      setUser({ username: localStorage.getItem('crm_user') });
    }
  }, [isLoggedIn]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/leads`, { headers: defaultHeaders() });
      setLeads(response.data);
    } catch (error) {
      console.error(error);
      setAuthError('Failed to load leads. Please check your login.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, login);
      localStorage.setItem('crm_token', response.data.token);
      localStorage.setItem('crm_user', response.data.username);
      setUser({ username: response.data.username });
      setAuthError('');
      fetchLeads();
    } catch (error) {
      console.error(error);
      setAuthError('Invalid username or password.');
    }
  }

  function handleLogout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setUser(null);
    setLeads([]);
  }

  async function handleCreateLead(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      source: form.source,
      status: form.status,
      company: form.company,
      notes: form.note ? [{ text: form.note }] : [],
    };

    try {
      await axios.post(`${API_BASE}/leads`, payload, { headers: defaultHeaders() });
      setForm({ name: '', email: '', source: 'Website', status: 'new', company: '', note: '' });
      fetchLeads();
    } catch (error) {
      console.error(error);
      setAuthError('Unable to create lead.');
    }
  }

  async function updateLead(id, updates) {
    try {
      await axios.put(`${API_BASE}/leads/${id}`, updates, { headers: defaultHeaders() });
      fetchLeads();
    } catch (error) {
      console.error(error);
      setAuthError('Update failed.');
    }
  }

  async function handleAddNote() {
    if (!selectedLead || !form.note) return;
    const updatedNotes = [...(selectedLead.notes || []), { text: form.note }];
    await updateLead(selectedLead._id, { notes: updatedNotes });
    setForm((prev) => ({ ...prev, note: '' }));
    setSelectedLead(null);
  }

  async function handleStatusChange(lead, status) {
    await updateLead(lead._id, { status });
  }

  return (
    <div className="app-shell">
      <header>
        <h1>Mini CRM</h1>
        {user && (
          <div className="user-bar">
            <span>Admin: {user.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>

      {!user ? (
        <main className="login-card">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <label>
              Username
              <input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required />
            </label>
            <button type="submit">Log in</button>
          </form>
          {authError && <p className="error">{authError}</p>}
        </main>
      ) : (
        <main className="crm-grid">
          <section className="lead-form-card">
            <h2>Add New Lead</h2>
            <form onSubmit={handleCreateLead}>
              <label>
                Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label>
                Company
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </label>
              <label>
                Source
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              </label>
              <label>
                Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                  <option value="converted">converted</option>
                </select>
              </label>
              <label>
                Note
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </label>
              <button type="submit">Create lead</button>
            </form>
          </section>

          <section className="lead-list-card">
            <div className="list-header">
              <h2>Lead list</h2>
              <span>{loading ? 'Loading...' : `${leads.length} leads`}</span>
            </div>
            <div className="lead-list">
              {leads.map((lead) => (
                <article key={lead._id} className="lead-item">
                  <div className="lead-top">
                    <div>
                      <h3>{lead.name}</h3>
                      <p>{lead.email}</p>
                      <p>{lead.company || 'No company'}</p>
                    </div>
                    <span className={`status ${lead.status}`}>{lead.status}</span>
                  </div>
                  <p className="source">Source: {lead.source}</p>
                  <div className="lead-actions">
                    <button onClick={() => handleStatusChange(lead, 'contacted')}>Contacted</button>
                    <button onClick={() => handleStatusChange(lead, 'converted')}>Converted</button>
                    <button onClick={() => setSelectedLead(lead)}>Add note</button>
                  </div>
                  {lead.notes?.length > 0 && (
                    <details>
                      <summary>Notes ({lead.notes.length})</summary>
                      <ul>
                        {lead.notes.map((note, idx) => (
                          <li key={idx}>{note.text}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </section>

          {selectedLead && (
            <section className="note-panel">
              <h2>Add note to {selectedLead.name}</h2>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Enter note text" />
              <button onClick={handleAddNote}>Save note</button>
              <button className="secondary" onClick={() => setSelectedLead(null)}>Cancel</button>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
