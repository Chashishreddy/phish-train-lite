import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

function formatDate(input) {
  if (!input) return '';
  return new Date(input).toLocaleString();
}

function RateBar({ label, value }) {
  const percentage = Math.round((value || 0) * 100);
  return (
    <div>
      <strong>{label}</strong>
      <div className="chart-bar">
        <div className="chart-bar-inner" style={{ width: `${percentage}%` }} />
      </div>
      <small>{percentage}%</small>
    </div>
  );
}

function AllowlistManager({ allowlist, refresh }) {
  const [csv, setCsv] = useState('');
  const [formEntries, setFormEntries] = useState([{ email: '', name: '', department: '' }]);
  const [message, setMessage] = useState('');

  const updateEntry = (index, key, value) => {
    setFormEntries(entries => entries.map((entry, idx) => idx === index ? { ...entry, [key]: value } : entry));
  };

  const addRow = () => {
    setFormEntries(entries => [...entries, { email: '', name: '', department: '' }]);
  };

  const submitManual = async () => {
    try {
      const filtered = formEntries.filter(entry => entry.email);
      await api('/api/allowlist', {
        method: 'POST',
        body: JSON.stringify({ employees: filtered })
      });
      setMessage('Allowlist updated.');
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const uploadCsv = async () => {
    try {
      await fetch(`${API_BASE}/api/allowlist/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: csv
      });
      setMessage('CSV processed.');
      setCsv('');
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="card">
      <h2>Employee Allowlist</h2>
      <p>Campaigns can only target the employees below. Domains blocked for safety: {allowlist.doNotSendDomains?.join(', ')}</p>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
          {allowlist.employees.map(emp => (
            <tr key={emp.email}>
              <td>{emp.email}</td>
              <td>{emp.name}</td>
              <td>{emp.department}</td>
            </tr>
          ))}
          {allowlist.employees.length === 0 && (
            <tr>
              <td colSpan={3}>No employees yet. Add entries below.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>Add Employees Manually</h3>
      {formEntries.map((entry, index) => (
        <div className="flex" key={index}>
          <input placeholder="email@example.com" value={entry.email} onChange={event => updateEntry(index, 'email', event.target.value)} />
          <input placeholder="Name" value={entry.name} onChange={event => updateEntry(index, 'name', event.target.value)} />
          <input placeholder="Department" value={entry.department} onChange={event => updateEntry(index, 'department', event.target.value)} />
        </div>
      ))}
      <button onClick={addRow}>Add another row</button>
      <button style={{ marginLeft: '0.5rem' }} onClick={submitManual}>Save allowlist</button>

      <h3>Upload CSV</h3>
      <textarea rows={4} placeholder="email,name,department" value={csv} onChange={event => setCsv(event.target.value)} />
      <button onClick={uploadCsv}>Upload CSV</button>

      {message && <p>{message}</p>}
    </div>
  );
}

function CampaignForm({ templates, allowlist, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    template_key: templates[0]?.key || '',
    subject: '',
    scheduled_time: '',
    end_time: '',
    recipients: [],
    from_email: '',
    manager_email: ''
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (templates.length && !form.template_key) {
      setForm(f => ({ ...f, template_key: templates[0].key, subject: templates[0].subject }));
    }
  }, [templates]);

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleRecipient = email => {
    setSelectedRecipients(prev => prev.includes(email) ? prev.filter(item => item !== email) : [...prev, email]);
  };

  useEffect(() => {
    update('recipients', selectedRecipients);
  }, [selectedRecipients]);

  const submit = async event => {
    event.preventDefault();
    try {
      const payload = { ...form, recipients: selectedRecipients };
      await api('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setStatus('Campaign drafted. Remember to request approval and set enable-sending once ready.');
      setForm({
        name: '',
        template_key: templates[0]?.key || '',
        subject: '',
        scheduled_time: '',
        end_time: '',
        recipients: [],
        from_email: '',
        manager_email: ''
      });
      setSelectedRecipients([]);
      onCreated();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const template = templates.find(item => item.key === form.template_key);

  return (
    <div className="card">
      <h2>Create Campaign</h2>
      <form onSubmit={submit}>
        <label>Name</label>
        <input required value={form.name} onChange={event => update('name', event.target.value)} />

        <label>Email template</label>
        <select value={form.template_key} onChange={event => {
          const value = event.target.value;
          update('template_key', value);
          const selectedTemplate = templates.find(item => item.key === value);
          if (selectedTemplate) {
            update('subject', selectedTemplate.subject);
          }
        }}>
          {templates.map(template => (
            <option value={template.key} key={template.key}>{template.name}</option>
          ))}
        </select>

        <label>Subject</label>
        <input value={form.subject} onChange={event => update('subject', event.target.value)} />

        <label>Schedule send time (ISO)</label>
        <input type="datetime-local" value={form.scheduled_time} onChange={event => update('scheduled_time', event.target.value)} />

        <label>Campaign end time (for automatic debrief)</label>
        <input type="datetime-local" value={form.end_time} onChange={event => update('end_time', event.target.value)} />

        <label>From email</label>
        <input placeholder="training@company.com" value={form.from_email} onChange={event => update('from_email', event.target.value)} />

        <label>Manager notification email</label>
        <input value={form.manager_email} onChange={event => update('manager_email', event.target.value)} />

        <label>Recipients (allowlist only)</label>
        <div className="card" style={{ background: '#f8fafc' }}>
          {allowlist.employees.map(emp => (
            <div key={emp.email}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(emp.email)}
                  onChange={() => toggleRecipient(emp.email)}
                />{' '}
                {emp.email} ({emp.department || 'No department'})
              </label>
            </div>
          ))}
          {allowlist.employees.length === 0 && <p>Add employees to the allowlist first.</p>}
        </div>

        <button type="submit">Create campaign</button>
      </form>
      {template && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Template preview</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f1f5f9', padding: '1rem' }}>{template.body}</pre>
        </div>
      )}
      {status && <p>{status}</p>}
    </div>
  );
}

function CampaignList({ campaigns, onRefresh }) {
  const approve = async id => {
    await api(`/api/campaigns/${id}/approve`, { method: 'POST' });
    onRefresh();
  };

  const queueSend = async id => {
    await api(`/api/campaigns/${id}/send`, { method: 'POST' });
    onRefresh();
  };

  const toggleSending = async (campaign, enabled) => {
    await api(`/api/campaigns/${campaign.id}`, {
      method: 'PUT',
      body: JSON.stringify({ enable_sending: enabled })
    });
    onRefresh();
  };

  const downloadCsv = id => {
    window.location = `/api/campaigns/${id}/export`;
  };

  return (
    <div className="card">
      <h2>Campaigns</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Schedule</th>
            <th>Approval</th>
            <th>Recipients</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(campaign => (
            <tr key={campaign.id}>
              <td>
                <div>{campaign.name}</div>
                <small>{campaign.template_key}</small>
              </td>
              <td>{campaign.status}</td>
              <td>
                <div>{campaign.scheduled_time ? formatDate(campaign.scheduled_time) : 'Not scheduled'}</div>
                <div>{campaign.end_time ? `Ends ${formatDate(campaign.end_time)}` : 'No end time'}</div>
              </td>
              <td>{campaign.approval ? <span className="badge">Approved</span> : 'Pending'}</td>
              <td>{campaign.recipient_count || 0}</td>
              <td>
                {!campaign.approval && <button onClick={() => approve(campaign.id)}>Approve</button>}
                {campaign.approval && <button onClick={() => queueSend(campaign.id)}>Queue send</button>}
                <button style={{ marginLeft: '0.5rem' }} onClick={() => toggleSending(campaign, !campaign.enable_sending)}>
                  {campaign.enable_sending ? 'Disable sending' : 'Enable sending'}
                </button>
                <button style={{ marginLeft: '0.5rem' }} onClick={() => downloadCsv(campaign.id)}>Export CSV</button>
              </td>
            </tr>
          ))}
          {campaigns.length === 0 && (
            <tr>
              <td colSpan={6}>No campaigns yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CampaignAnalytics({ campaignId }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!campaignId) return;
    api(`/api/campaigns/${campaignId}/analytics`)
      .then(setStats)
      .catch(err => setError(err.message));
  }, [campaignId]);

  if (!campaignId) {
    return (
      <div className="card">
        <h2>Analytics</h2>
        <p>Select a campaign to view performance.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Analytics</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <h2>Analytics</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Analytics</h2>
      <p>Delivered: {stats.delivered} · Opened: {stats.opened} · Clicked: {stats.clicked} · Submitted (simulated): {stats.submitted}</p>
      <div className="flex">
        <RateBar label="Open rate" value={stats.openRate} />
        <RateBar label="Click rate" value={stats.clickRate} />
        <RateBar label="Click-to-submit" value={stats.submitRate} />
      </div>
    </div>
  );
}

export default function App() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [allowlist, setAllowlist] = useState({ employees: [], doNotSendDomains: [] });
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const refreshTemplates = () => {
    api('/api/templates').then(setTemplates).catch(console.error);
  };

  const refreshAllowlist = () => {
    api('/api/allowlist').then(setAllowlist).catch(console.error);
  };

  const refreshCampaigns = () => {
    api('/api/campaigns').then(data => {
      setCampaigns(data);
      if (selectedCampaign) {
        const exists = data.find(item => item.id === selectedCampaign);
        if (!exists) setSelectedCampaign(null);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    refreshTemplates();
    refreshAllowlist();
    refreshCampaigns();
  }, []);

  return (
    <div>
      <header>
        <h1>Phishing Detection Awareness Admin</h1>
        <p>For internal employee training only. Require HR approval before launching a campaign.</p>
      </header>
      <main>
        <AllowlistManager allowlist={allowlist} refresh={refreshAllowlist} />
        <CampaignForm templates={templates} allowlist={allowlist} onCreated={refreshCampaigns} />
        <div className="card">
          <h2>Select campaign for analytics</h2>
          <select value={selectedCampaign || ''} onChange={event => setSelectedCampaign(event.target.value ? Number(event.target.value) : null)}>
            <option value="">Select</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
        </div>
        <CampaignAnalytics campaignId={selectedCampaign} />
        <CampaignList campaigns={campaigns} onRefresh={refreshCampaigns} />
      </main>
    </div>
  );
}
