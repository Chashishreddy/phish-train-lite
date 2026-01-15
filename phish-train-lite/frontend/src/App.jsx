import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Login from './components/Login';
import EmployeeAnalytics from './components/EmployeeAnalytics';
import TrendsAnalytics from './components/TrendsAnalytics';
import CompareAnalytics from './components/CompareAnalytics';
import DepartmentRiskScoring from './components/DepartmentRiskScoring';
import RepeatOffenders from './components/RepeatOffenders';
import EmailPreview from './components/EmailPreview';

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

function StatCard({ title, value, subtitle }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
      {subtitle && <div className="subtitle">{subtitle}</div>}
    </div>
  );
}

function TabNav({ activeTab, onChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'allowlist', label: 'Allowlist' },
    { id: 'groups', label: 'Groups' },
    { id: 'analytics', label: 'Analytics' }
  ];

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Dashboard({ allowlist, campaigns }) {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaignAnalytics, setCampaignAnalytics] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const analyticsPromises = campaigns
        .filter(c => c.recipient_count > 0)
        .map(c => apiCall(`/api/campaigns/${c.id}/analytics`).catch(() => null));

      const results = await Promise.all(analyticsPromises);
      setCampaignAnalytics(results.filter(r => r !== null));
      setLoading(false);
    };

    if (campaigns.length > 0) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [campaigns, apiCall]);

  const departmentStats = allowlist.employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const sortedDepartments = Object.entries(departmentStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 17);

  const maxDeptCount = Math.max(...sortedDepartments.map(([, count]) => count));

  const campaignsByStatus = campaigns.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const aggregateMetrics = campaignAnalytics.reduce((acc, analytics) => {
    if (analytics) {
      acc.delivered += analytics.delivered || 0;
      acc.opened += analytics.opened || 0;
      acc.clicked += analytics.clicked || 0;
      acc.submitted += analytics.submitted || 0;
    }
    return acc;
  }, { delivered: 0, opened: 0, clicked: 0, submitted: 0 });

  const openRate = aggregateMetrics.delivered > 0
    ? (aggregateMetrics.opened / aggregateMetrics.delivered)
    : 0;
  const clickRate = aggregateMetrics.delivered > 0
    ? (aggregateMetrics.clicked / aggregateMetrics.delivered)
    : 0;
  const submitRate = aggregateMetrics.clicked > 0
    ? (aggregateMetrics.submitted / aggregateMetrics.clicked)
    : 0;

  const recentActivity = campaigns
    .map(c => ({
      campaign: c.name,
      action: c.approval ? 'Approved' : 'Created',
      time: c.approval ? c.updated_at : c.created_at,
      status: c.status
    }))
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 10);

  return (
    <div>
      <div className="card">
        <h2>Overview</h2>
        <div className="stat-grid">
          <StatCard
            title="Total Employees"
            value={allowlist.employees.length.toLocaleString()}
            subtitle={`Across ${Object.keys(departmentStats).length} departments`}
          />
          <StatCard
            title="Total Campaigns"
            value={campaigns.length}
            subtitle={`${campaignsByStatus.running || 0} active`}
          />
          <StatCard
            title="Draft Campaigns"
            value={campaignsByStatus.draft || 0}
            subtitle="Awaiting approval"
          />
          <StatCard
            title="Completed Campaigns"
            value={campaignsByStatus.completed || 0}
            subtitle="Finished training"
          />
        </div>
      </div>

      <div className="card">
        <h2>Employee Distribution by Department</h2>
        {sortedDepartments.length === 0 ? (
          <p>No employees in allowlist yet.</p>
        ) : (
          <div className="department-list">
            {sortedDepartments.map(([dept, count]) => (
              <div key={dept} className="department-item">
                <div className="department-name">{dept}</div>
                <div className="department-bar-container">
                  <div className="department-bar">
                    <div
                      className="department-bar-fill"
                      style={{ width: `${(count / maxDeptCount) * 100}%` }}
                    />
                  </div>
                  <div className="department-count">{count}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Aggregate Campaign Metrics</h2>
        {loading ? (
          <p>Loading campaign metrics...</p>
        ) : campaignAnalytics.length === 0 ? (
          <p>No campaign data available yet. Create and send campaigns to see metrics.</p>
        ) : (
          <div>
            <div className="stat-grid">
              <StatCard
                title="Total Delivered"
                value={aggregateMetrics.delivered.toLocaleString()}
                subtitle="Emails sent"
              />
              <StatCard
                title="Total Opened"
                value={aggregateMetrics.opened.toLocaleString()}
                subtitle={`${Math.round(openRate * 100)}% open rate`}
              />
              <StatCard
                title="Total Clicked"
                value={aggregateMetrics.clicked.toLocaleString()}
                subtitle={`${Math.round(clickRate * 100)}% click rate`}
              />
              <StatCard
                title="Total Submitted"
                value={aggregateMetrics.submitted.toLocaleString()}
                subtitle={`${Math.round(submitRate * 100)}% of clicks`}
              />
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <RateBar label="Overall Open Rate" value={openRate} />
              <RateBar label="Overall Click Rate" value={clickRate} />
              <RateBar label="Overall Submit Rate" value={submitRate} />
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p>No activity yet. Create campaigns to see activity.</p>
        ) : (
          <div className="activity-timeline">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-time">{formatDate(activity.time)}</div>
                <div className="activity-content">
                  <div className="activity-campaign">{activity.campaign}</div>
                  <div className="activity-action">
                    {activity.action} • Status: {activity.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AllowlistManager({ allowlist, refresh }) {
  const { apiCall, isManager, toast } = useAuth();
  const [csv, setCsv] = useState('');
  const [formEntries, setFormEntries] = useState([{ email: '', name: '', department: '' }]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [csvPreview, setCsvPreview] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const itemsPerPage = 50;

  const updateEntry = (index, key, value) => {
    setFormEntries(entries => entries.map((entry, idx) => idx === index ? { ...entry, [key]: value } : entry));
  };

  const addRow = () => {
    setFormEntries(entries => [...entries, { email: '', name: '', department: '' }]);
  };

  const submitManual = async () => {
    try {
      const filtered = formEntries.filter(entry => entry.email);

      if (filtered.length === 0) {
        toast.info('No employees to add');
        return;
      }

      const response = await apiCall('/api/allowlist', {
        method: 'POST',
        body: JSON.stringify({ employees: filtered })
      });

      const { added, rejected, rejectedEmails } = response;

      // Show appropriate message based on result
      if (added === 0 && rejected > 0) {
        // All emails rejected
        toast.error(`No employees added – all ${rejected} email${rejected > 1 ? 's' : ''} from blocked domains`);
      } else if (rejected > 0) {
        // Some rejected, some added
        toast.warning(`${added} employee${added > 1 ? 's' : ''} added, ${rejected} rejected (blocked domains)`);
      } else if (added > 0) {
        // All added successfully
        toast.success(`${added} employee${added > 1 ? 's' : ''} added successfully`);
        // Clear form on success
        setFormEntries([{ email: '', name: '', department: '' }]);
      }

      setMessage('');
      refresh();
    } catch (error) {
      toast.error(`Failed to save: ${error.message}`);
      setMessage('');
    }
  };

  const validateCsv = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${API_BASE}/api/allowlist/validate-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-CSRF-Token': localStorage.getItem('csrfToken')
        },
        body: csv
      });

      const data = await response.json();
      setCsvPreview(data);
    } catch (error) {
      toast.error(`Validation failed: ${error.message}`);
    }
  };

  const uploadCsv = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${API_BASE}/api/allowlist/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-CSRF-Token': localStorage.getItem('csrfToken')
        },
        body: csv
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const { imported, rejected, totalRows, rejectedEmails } = data;

      // Show appropriate message based on result
      if (imported === 0 && rejected > 0) {
        // All emails rejected
        toast.error(`No employees added – all ${rejected} email${rejected > 1 ? 's' : ''} from blocked domains`);
      } else if (rejected > 0) {
        // Some rejected, some imported
        toast.warning(`CSV imported: ${imported} added, ${rejected} rejected (blocked domains)`);
      } else if (imported > 0) {
        // All imported successfully
        toast.success(`CSV imported successfully: ${imported} employee${imported > 1 ? 's' : ''} added`);
      } else {
        // Empty CSV
        toast.info('No valid employees found in CSV');
      }

      setCsv('');
      setCsvPreview(null);
      refresh();
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    }
  };

  const toggleEmailSelection = (email) => {
    setSelectedEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmails.length === paginatedEmployees.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(paginatedEmployees.map(emp => emp.email));
    }
  };

  const bulkDelete = async () => {
    if (selectedEmails.length === 0) {
      toast.warning('No employees selected');
      return;
    }

    if (!confirm(`Delete ${selectedEmails.length} selected employees from the allowlist? This action cannot be undone.`)) return;

    try {
      const response = await apiCall('/api/allowlist/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: selectedEmails })
      });

      toast.success(`${response.count} employees deleted`);
      setSelectedEmails([]);
      refresh();
    } catch (error) {
      toast.error(`Failed to bulk delete: ${error.message}`);
    }
  };

  const startEditing = (emp) => {
    setEditingEmployee({ ...emp });
  };

  const cancelEditing = () => {
    setEditingEmployee(null);
  };

  const saveEmployee = async () => {
    if (!editingEmployee) return;

    try {
      await apiCall(`/api/allowlist/${encodeURIComponent(editingEmployee.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingEmployee.name,
          department: editingEmployee.department
        })
      });

      toast.success('Employee updated');
      setEditingEmployee(null);
      refresh();
    } catch (error) {
      toast.error(`Failed to update employee: ${error.message}`);
    }
  };

  const filteredEmployees = allowlist.employees.filter(emp => {
    const matchesSearch = searchTerm === '' ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment = departmentFilter === '' || emp.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const departments = [...new Set(allowlist.employees.map(emp => emp.department).filter(Boolean))].sort();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter]);

  return (
    <div className="card">
      <h2>Employee Allowlist</h2>
      <p>Total: {allowlist.employees.length.toLocaleString()} employees. Domains blocked: {allowlist.doNotSendDomains?.join(', ')}</p>

      <div className="flex" style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Search by email, name, or department..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <p>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length.toLocaleString()} {searchTerm || departmentFilter ? 'filtered' : ''} employees</p>

      {selectedEmails.length > 0 && isManager && (
        <div className="flex" style={{ marginBottom: '1rem', gap: '0.5rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', fontWeight: '500' }}>
            {selectedEmails.length} employee{selectedEmails.length !== 1 ? 's' : ''} selected
          </span>
          <button onClick={bulkDelete} style={{ background: '#dc2626' }}>Bulk Delete</button>
          <button onClick={() => setSelectedEmails([])} style={{ background: '#64748b' }}>Clear Selection</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            {isManager && (
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={paginatedEmployees.length > 0 && selectedEmails.length === paginatedEmployees.length}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )}
            <th>Email</th>
            <th>Name</th>
            <th>Department</th>
            {isManager && <th style={{ width: '120px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedEmployees.map(emp => {
            const isEditing = editingEmployee?.email === emp.email;
            return (
              <tr key={emp.email}>
                {isManager && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(emp.email)}
                      onChange={() => toggleEmailSelection(emp.email)}
                      style={{ cursor: 'pointer' }}
                      disabled={isEditing}
                    />
                  </td>
                )}
                <td>{emp.email}</td>
                <td>
                  {isEditing ? (
                    <input
                      value={editingEmployee.name}
                      onChange={e => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    emp.name
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      value={editingEmployee.department}
                      onChange={e => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    emp.department
                  )}
                </td>
                {isManager && (
                  <td>
                    {isEditing ? (
                      <div className="flex" style={{ gap: '0.25rem' }}>
                        <button onClick={saveEmployee} style={{ background: '#10b981', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Save</button>
                        <button onClick={cancelEditing} style={{ background: '#64748b', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEditing(emp)} style={{ background: '#3b82f6', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Edit</button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {filteredEmployees.length === 0 && (
            <tr>
              <td colSpan={isManager ? 5 : 3}>No employees found. {searchTerm || departmentFilter ? 'Try adjusting your filters.' : 'Add entries below.'}</td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={{ margin: '0 1rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {isManager && (
        <>
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
          <button onClick={validateCsv} disabled={!csv.trim()}>Preview & Validate CSV</button>
        </>
      )}

      {message && <p>{message}</p>}

      {csvPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '2rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}>
            <h3>CSV Import Preview</h3>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
              <strong>Summary:</strong>
              <div>Total lines: {csvPreview.summary.total}</div>
              <div style={{ color: '#10b981' }}>✓ Valid entries: {csvPreview.summary.valid}</div>
              {csvPreview.summary.invalid > 0 && <div style={{ color: '#dc2626' }}>✗ Invalid entries: {csvPreview.summary.invalid}</div>}
              {csvPreview.summary.rejected > 0 && <div style={{ color: '#f59e0b' }}>⚠ Rejected (forbidden domains): {csvPreview.summary.rejected}</div>}
            </div>

            {csvPreview.valid.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Valid Entries ({csvPreview.valid.length}):</strong>
                <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '0.5rem' }}>
                  <table style={{ width: '100%', fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.valid.slice(0, 50).map((entry, i) => (
                        <tr key={i}>
                          <td>{entry.email}</td>
                          <td>{entry.name}</td>
                          <td>{entry.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.valid.length > 50 && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>...and {csvPreview.valid.length - 50} more</p>}
                </div>
              </div>
            )}

            {csvPreview.invalid.length > 0 && (
              <div style={{ marginBottom: '1.5rem', color: '#dc2626' }}>
                <strong>Invalid Entries ({csvPreview.invalid.length}):</strong>
                <div style={{ maxHeight: '150px', overflow: 'auto', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  {csvPreview.invalid.map((entry, i) => (
                    <div key={i}>Line {entry.line}: {entry.reason} - "{entry.data}"</div>
                  ))}
                </div>
              </div>
            )}

            {csvPreview.rejected.length > 0 && (
              <div style={{ marginBottom: '1.5rem', color: '#f59e0b' }}>
                <strong>Rejected Entries ({csvPreview.rejected.length}):</strong>
                <div style={{ maxHeight: '150px', overflow: 'auto', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  {csvPreview.rejected.map((entry, i) => (
                    <div key={i}>Line {entry.line}: {entry.email} - {entry.reason}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setCsvPreview(null)} style={{ background: '#64748b' }}>Cancel</button>
              <button
                onClick={uploadCsv}
                disabled={csvPreview.summary.valid === 0}
                style={{ background: '#10b981' }}
              >
                Import {csvPreview.summary.valid} Valid Entries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupsManager({ groups, allowlist, refresh }) {
  const { apiCall, isManager, toast } = useAuth();
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast.warning('Group name is required');
      return;
    }

    try {
      await apiCall('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDescription })
      });

      toast.success('Group created');
      setNewGroupName('');
      setNewGroupDescription('');
      refresh();
    } catch (error) {
      toast.error(`Failed to create group: ${error.message}`);
    }
  };

  const updateGroup = async () => {
    if (!editingGroup || !editingGroup.name.trim()) {
      toast.warning('Group name is required');
      return;
    }

    try {
      await apiCall(`/api/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingGroup.name, description: editingGroup.description })
      });

      toast.success('Group updated');
      setEditingGroup(null);
      refresh();
    } catch (error) {
      toast.error(`Failed to update group: ${error.message}`);
    }
  };

  const deleteGroup = async (id) => {
    if (!confirm('Delete this group? This will not delete the employees, only the group.')) return;

    try {
      await apiCall(`/api/groups/${id}`, { method: 'DELETE' });
      toast.success('Group deleted');
      if (selectedGroup?.id === id) setSelectedGroup(null);
      refresh();
    } catch (error) {
      toast.error(`Failed to delete group: ${error.message}`);
    }
  };

  const addMembersToGroup = async () => {
    if (!selectedGroup || selectedEmails.length === 0) {
      toast.warning('Select employees to add');
      return;
    }

    try {
      await apiCall(`/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: selectedEmails })
      });

      toast.success(`${selectedEmails.length} members added to group`);
      setSelectedEmails([]);
      refresh();
    } catch (error) {
      toast.error(`Failed to add members: ${error.message}`);
    }
  };

  const removeMember = async (groupId, email) => {
    try {
      await apiCall(`/api/groups/${groupId}/members/${encodeURIComponent(email)}`, { method: 'DELETE' });
      toast.success('Member removed from group');
      refresh();
    } catch (error) {
      toast.error(`Failed to remove member: ${error.message}`);
    }
  };

  const filteredEmployees = allowlist.employees.filter(emp => {
    const matchesSearch = searchTerm === '' ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Don't show employees already in the selected group
    const notInGroup = !selectedGroup || !selectedGroup.members.includes(emp.email);

    return matchesSearch && notInGroup;
  });

  return (
    <div className="card">
      <h2>Employee Groups</h2>
      <p>Create and manage groups of employees for easier campaign targeting.</p>

      {isManager && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
          <h3>Create New Group</h3>
          <div className="flex" style={{ marginBottom: '0.5rem' }}>
            <input
              placeholder="Group name"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              style={{ flex: 2 }}
            />
            <input
              placeholder="Description (optional)"
              value={newGroupDescription}
              onChange={e => setNewGroupDescription(e.target.value)}
              style={{ flex: 3 }}
            />
            <button onClick={createGroup}>Create Group</button>
          </div>
        </div>
      )}

      <h3>All Groups ({groups.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {groups.map(group => (
          <div key={group.id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: selectedGroup?.id === group.id ? '#e0f2fe' : '#fff' }}>
            {editingGroup?.id === group.id ? (
              <>
                <input
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                />
                <textarea
                  value={editingGroup.description}
                  onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  rows={2}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                />
                <div className="flex" style={{ gap: '0.5rem' }}>
                  <button onClick={updateGroup} style={{ background: '#10b981' }}>Save</button>
                  <button onClick={() => setEditingGroup(null)} style={{ background: '#64748b' }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{group.name}</h4>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>{group.description || 'No description'}</p>
                <p style={{ fontSize: '0.85rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>{group.member_count} member{group.member_count !== 1 ? 's' : ''}</p>
                <div className="flex" style={{ gap: '0.5rem' }}>
                  <button onClick={() => setSelectedGroup(group)} style={{ background: '#3b82f6', flex: 1 }}>
                    {selectedGroup?.id === group.id ? 'Selected' : 'Manage'}
                  </button>
                  {isManager && (
                    <>
                      <button onClick={() => setEditingGroup(group)} style={{ background: '#f59e0b' }}>Edit</button>
                      <button onClick={() => deleteGroup(group.id)} style={{ background: '#dc2626' }}>Delete</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {groups.length === 0 && <p>No groups yet. Create one above!</p>}
      </div>

      {selectedGroup && (
        <>
          <h3>Managing Group: {selectedGroup.name}</h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4>Current Members ({selectedGroup.member_count})</h4>
            <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
              {selectedGroup.members.length === 0 ? (
                <p>No members in this group yet.</p>
              ) : (
                <table style={{ width: '100%' }}>
                  <tbody>
                    {selectedGroup.members.map(email => (
                      <tr key={email}>
                        <td>{email}</td>
                        <td style={{ textAlign: 'right' }}>
                          {isManager && (
                            <button onClick={() => removeMember(selectedGroup.id, email)} style={{ background: '#dc2626', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {isManager && (
            <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
              <h4>Add Members to {selectedGroup.name}</h4>
              <input
                placeholder="Search employees by email or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />

              {selectedEmails.length > 0 && (
                <div className="flex" style={{ marginBottom: '1rem', gap: '0.5rem', padding: '0.75rem', background: '#fff', borderRadius: '8px' }}>
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                    {selectedEmails.length} employee{selectedEmails.length !== 1 ? 's' : ''} selected
                  </span>
                  <button onClick={addMembersToGroup} style={{ background: '#10b981' }}>Add to Group</button>
                  <button onClick={() => setSelectedEmails([])} style={{ background: '#64748b' }}>Clear</button>
                </div>
              )}

              <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#fff' }}>
                {filteredEmployees.slice(0, 50).map(emp => (
                  <div key={emp.email} style={{ marginBottom: '0.5rem' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(emp.email)}
                        onChange={() => {
                          setSelectedEmails(prev =>
                            prev.includes(emp.email) ? prev.filter(e => e !== emp.email) : [...prev, emp.email]
                          );
                        }}
                      />{' '}
                      {emp.email} - {emp.name} {emp.department && `(${emp.department})`}
                    </label>
                  </div>
                ))}
                {filteredEmployees.length === 0 && <p>No employees available to add.</p>}
                {filteredEmployees.length > 50 && <p style={{ fontSize: '0.85rem', color: '#64748b' }}>...and {filteredEmployees.length - 50} more. Use search to narrow down.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DepartmentSelector({ allowlist, selectedDepartments, toggleDepartment }) {
  const departmentCounts = allowlist.employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const departments = Object.entries(departmentCounts).sort(([, a], [, b]) => b - a);

  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
      {departments.map(([dept, count]) => (
        <div key={dept} style={{ marginBottom: '0.5rem' }}>
          <label>
            <input
              type="checkbox"
              checked={selectedDepartments.includes(dept)}
              onChange={() => toggleDepartment(dept)}
            />{' '}
            <strong>{dept}</strong> ({count.toLocaleString()} employees)
          </label>
        </div>
      ))}
    </div>
  );
}

function IndividualSelector({ allowlist, selectedRecipients, toggleRecipient, searchTerm, setSearchTerm }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredEmployees = allowlist.employees.filter(emp =>
    searchTerm === '' ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div>
      <input
        placeholder="Search employees..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{ marginBottom: '1rem' }}
      />

      {allowlist.employees.length === 0 ? (
        <p>Add employees to the allowlist first.</p>
      ) : (
        <>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length.toLocaleString()}
          </p>

          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
            {paginatedEmployees.map(emp => (
              <div key={emp.email} style={{ marginBottom: '0.25rem' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedRecipients.includes(emp.email)}
                    onChange={() => toggleRecipient(emp.email)}
                  />{' '}
                  {emp.email} ({emp.department || 'No dept'})
                </label>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span style={{ margin: '0 0.5rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CampaignForm({ templates, allowlist, onCreated, editingCampaign, onCancelEdit }) {
  const { apiCall, isManager } = useAuth();
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
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [recipientMode, setRecipientMode] = useState('departments');
  const [searchTerm, setSearchTerm] = useState('');

  // Load campaign data when editing
  useEffect(() => {
    if (editingCampaign) {
      // Fetch full campaign data including recipients
      apiCall(`/api/campaigns/${editingCampaign.id}`)
        .then(campaign => {
          setForm({
            name: campaign.name,
            template_key: campaign.template_key,
            subject: campaign.subject,
            scheduled_time: campaign.scheduled_time || '',
            end_time: campaign.end_time || '',
            recipients: campaign.recipients || [],
            from_email: campaign.from_email || '',
            manager_email: campaign.manager_email || ''
          });
          setSelectedRecipients(campaign.recipients || []);
          setStatus('');
        })
        .catch(err => {
          setStatus(`Failed to load campaign data: ${err.message}`);
          console.error(err);
        });
    }
  }, [editingCampaign, apiCall]);
  const [showPreview, setShowPreview] = useState(false);

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

  const toggleDepartment = dept => {
    setSelectedDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const finalRecipients = recipientMode === 'departments'
    ? allowlist.employees
        .filter(emp => selectedDepartments.includes(emp.department))
        .map(emp => emp.email)
    : selectedRecipients;

  useEffect(() => {
    update('recipients', finalRecipients);
  }, [finalRecipients.length]);

  const submit = async event => {
    event.preventDefault();
    try {
      const payload = { ...form, recipients: finalRecipients };

      if (editingCampaign) {
        // Update existing campaign
        await apiCall(`/api/campaigns/${editingCampaign.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setStatus('Campaign updated successfully.');
      } else {
        // Create new campaign
        await apiCall('/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setStatus('Campaign drafted. Remember to request approval and set enable-sending once ready.');
      }

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
      setSelectedDepartments([]);
      setSearchTerm('');
      onCreated();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const template = templates.find(item => item.key === form.template_key);

  if (!isManager) {
    return (
      <div className="card">
        <h2>Create Campaign</h2>
        <p>You don't have permission to create campaigns. Contact an administrator.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{editingCampaign ? `Edit Campaign: ${editingCampaign.name}` : 'Create Campaign'}</h2>
        {editingCampaign && (
          <button type="button" onClick={onCancelEdit} style={{ background: '#6b7280' }}>
            Cancel Edit
          </button>
        )}
      </div>
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

        <button
          type="button"
          onClick={() => setShowPreview(true)}
          style={{
            background: 'transparent',
            border: '2px solid #C99E39',
            color: '#C99E39',
            marginBottom: '1rem'
          }}
        >
          Preview Email
        </button>

        <label>Schedule send time (ISO)</label>
        <input type="datetime-local" value={form.scheduled_time} onChange={event => update('scheduled_time', event.target.value)} />

        <label>Campaign end time (for automatic debrief)</label>
        <input type="datetime-local" value={form.end_time} onChange={event => update('end_time', event.target.value)} />

        <label>From email</label>
        <input placeholder="training@company.com" value={form.from_email} onChange={event => update('from_email', event.target.value)} />

        <label>Manager notification email</label>
        <input value={form.manager_email} onChange={event => update('manager_email', event.target.value)} />

        <label>Target Recipients</label>
        <div className="card" style={{ background: '#f8fafc', padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '1rem' }}>
              <input
                type="radio"
                checked={recipientMode === 'departments'}
                onChange={() => setRecipientMode('departments')}
              />{' '}
              By Department
            </label>
            <label>
              <input
                type="radio"
                checked={recipientMode === 'individual'}
                onChange={() => setRecipientMode('individual')}
              />{' '}
              Individual Selection
            </label>
          </div>

          {recipientMode === 'departments' ? (
            <DepartmentSelector
              allowlist={allowlist}
              selectedDepartments={selectedDepartments}
              toggleDepartment={toggleDepartment}
            />
          ) : (
            <IndividualSelector
              allowlist={allowlist}
              selectedRecipients={selectedRecipients}
              toggleRecipient={toggleRecipient}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e0f2fe', borderRadius: '4px' }}>
            <strong>Selected: {finalRecipients.length.toLocaleString()} recipients</strong>
          </div>
        </div>

        <button type="submit" disabled={finalRecipients.length === 0}>
          {editingCampaign ? 'Update campaign' : 'Create campaign'}
        </button>
      </form>
      {template && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Template preview</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f1f5f9', padding: '1rem' }}>{template.body}</pre>
        </div>
      )}
      {status && <p>{status}</p>}

      {showPreview && (
        <EmailPreview
          templateKey={form.template_key}
          customSubject={form.subject}
          customBody=""
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function CampaignList({ campaigns, onRefresh, onEdit }) {
  const { apiCall, isAdmin, isManager } = useAuth();
  const toast = useToast();
  const [testEmailModal, setTestEmailModal] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testSampleName, setTestSampleName] = useState('John Doe');
  const [testSampleDepartment, setTestSampleDepartment] = useState('IT Department');
  const [testEmailStatus, setTestEmailStatus] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const itemsPerPage = 10;

  const approve = async id => {
    try {
      await apiCall(`/api/campaigns/${id}/approve`, { method: 'POST' });
      toast.success('Campaign approved successfully');
      onRefresh();
    } catch (error) {
      toast.error(`Failed to approve campaign: ${error.message}`);
    }
  };

  const queueSend = async id => {
    try {
      await apiCall(`/api/campaigns/${id}/send`, { method: 'POST' });
      toast.success('Campaign queued for sending');
      onRefresh();
    } catch (error) {
      toast.error(`Failed to queue campaign: ${error.message}`);
    }
  };

  const toggleSending = async (campaign, enabled) => {
    try {
      await apiCall(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        body: JSON.stringify({ enable_sending: enabled })
      });

      if (enabled) {
        toast.success(`Sending enabled for campaign "${campaign.name}"`);
      } else {
        toast.info(`Sending disabled for campaign "${campaign.name}"`);
      }

      onRefresh();
    } catch (error) {
      toast.error(`Failed to ${enabled ? 'enable' : 'disable'} sending: ${error.message}`);
    }
  };

  const downloadCsv = id => {
    window.location = `/api/campaigns/${id}/export`;
  };

  const openTestEmailModal = (campaignId) => {
    setTestEmailModal(campaignId);
    setTestEmailAddress('');
    setTestEmailStatus('');
    setTestSampleName('John Doe');
    setTestSampleDepartment('IT Department');
  };

  const sendTestEmail = async () => {
    if (!testEmailAddress) {
      setTestEmailStatus('Please enter a test email address');
      return;
    }

    setSendingTest(true);
    setTestEmailStatus('');

    try {
      const response = await apiCall(`/api/campaigns/${testEmailModal}/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: testEmailAddress,
          sampleName: testSampleName,
          sampleDepartment: testSampleDepartment
        })
      });

      // Show detailed testing information with tracking URLs
      const statusMessage = [
        `✓ ${response.message}`,
        `📧 Sent to: ${response.sentTo}`,
        ``,
        `📍 Open Tracking URL:`,
        response.trackingPixelUrl,
        ``,
        `🔗 Click Tracking URL:`,
        response.clickTrackingUrl,
        ``,
        `💡 Copy these URLs and open in browser to test tracking.`,
        `Check backend console for email content.`
      ].join('\n');

      setTestEmailStatus(statusMessage);

      // Don't auto-close so user can copy URLs
      // User can manually close the modal
    } catch (error) {
      setTestEmailStatus(`Error: ${error.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  const cloneCampaign = async (campaignId) => {
    if (!confirm('Clone this campaign? A copy will be created as a draft.')) return;

    try {
      const response = await apiCall(`/api/campaigns/${campaignId}/clone`, {
        method: 'POST'
      });

      toast.success(`Campaign cloned: ${response.name}`);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to clone campaign: ${error.message}`);
    }
  };

  const pauseCampaign = async (campaignId) => {
    if (!confirm('Pause this campaign? Email sending will be stopped until you resume.')) return;

    try {
      await apiCall(`/api/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });

      toast.success('Campaign paused successfully');
      onRefresh();
    } catch (error) {
      toast.error(`Failed to pause campaign: ${error.message}`);
    }
  };

  const resumeCampaign = async (campaignId) => {
    if (!confirm('Resume this campaign? Email sending will continue.')) return;

    try {
      await apiCall(`/api/campaigns/${campaignId}/resume`, {
        method: 'POST'
      });

      toast.success('Campaign resumed successfully');
      onRefresh();
    } catch (error) {
      toast.error(`Failed to resume campaign: ${error.message}`);
    }
  };

  const toggleCampaignSelection = (campaignId) => {
    setSelectedCampaigns(prev =>
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCampaigns.length === paginatedCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(paginatedCampaigns.map(c => c.id));
    }
  };

  const bulkApprove = async () => {
    if (selectedCampaigns.length === 0) {
      toast.warning('No campaigns selected');
      return;
    }

    if (!confirm(`Approve ${selectedCampaigns.length} selected campaigns?`)) return;

    try {
      const response = await apiCall('/api/campaigns/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignIds: selectedCampaigns })
      });

      toast.success(`${response.count} campaigns approved`);
      setSelectedCampaigns([]);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to bulk approve: ${error.message}`);
    }
  };

  const bulkDelete = async () => {
    if (selectedCampaigns.length === 0) {
      toast.warning('No campaigns selected');
      return;
    }

    if (!confirm(`Delete ${selectedCampaigns.length} selected campaigns? This action cannot be undone.`)) return;

    try {
      const response = await apiCall('/api/campaigns/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignIds: selectedCampaigns })
      });

      toast.success(`${response.count} campaigns deleted`);
      setSelectedCampaigns([]);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to bulk delete: ${error.message}`);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter, sort, and paginate campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchTerm === '' ||
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.template_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.subject && campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === '' || campaign.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';

    // String comparison
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCampaigns = sortedCampaigns.slice(startIndex, startIndex + itemsPerPage);

  const statuses = [...new Set(campaigns.map(c => c.status))].sort();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="card">
      <h2>Campaigns</h2>

      <div className="flex" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
        <input
          placeholder="Search campaigns by name, template, or subject..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: '150px' }}>
          <option value="">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCampaigns.length)} of {filteredCampaigns.length} {searchTerm || statusFilter ? 'filtered' : ''} campaigns
      </p>

      {selectedCampaigns.length > 0 && isAdmin && (
        <div className="flex" style={{ marginBottom: '1rem', gap: '0.5rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', fontWeight: '500' }}>
            {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? 's' : ''} selected
          </span>
          <button onClick={bulkApprove} style={{ background: '#10b981' }}>Bulk Approve</button>
          <button onClick={bulkDelete} style={{ background: '#dc2626' }}>Bulk Delete</button>
          <button onClick={() => setSelectedCampaigns([])} style={{ background: '#64748b' }}>Clear Selection</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            {isAdmin && (
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={paginatedCampaigns.length > 0 && selectedCampaigns.length === paginatedCampaigns.length}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )}
            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('scheduled_time')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Schedule {sortField === 'scheduled_time' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('approval')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Approval {sortField === 'approval' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('recipient_count')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Recipients {sortField === 'recipient_count' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCampaigns.map(campaign => (
            <tr key={campaign.id}>
              {isAdmin && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(campaign.id)}
                    onChange={() => toggleCampaignSelection(campaign.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              )}
              <td>
                <div>{campaign.name}</div>
                <small>{campaign.template_key}</small>
              </td>
              <td>
                <div style={{ marginBottom: '0.25rem' }}>{campaign.status}</div>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {campaign.paused && <span className="badge" style={{ background: '#dc2626', color: '#fff' }}>Paused</span>}
                  {campaign.enable_sending ? (
                    <span className="badge" style={{ background: '#10b981', color: '#fff' }}>Sending Enabled</span>
                  ) : (
                    <span className="badge" style={{ background: '#6b7280', color: '#fff' }}>Sending Disabled</span>
                  )}
                </div>
              </td>
              <td>
                <div>{campaign.scheduled_time ? formatDate(campaign.scheduled_time) : 'Not scheduled'}</div>
                <div>{campaign.end_time ? `Ends ${formatDate(campaign.end_time)}` : 'No end time'}</div>
              </td>
              <td>{campaign.approval ? <span className="badge">Approved</span> : 'Pending'}</td>
              <td>{campaign.recipient_count || 0}</td>
              <td>
                {campaign.status === 'draft' && isManager && (
                  <button onClick={() => onEdit(campaign)}>Edit</button>
                )}
                {!campaign.approval && isAdmin && campaign.status !== 'draft' && (
                  <button style={{ marginLeft: campaign.status === 'draft' ? '0' : '0.5rem' }} onClick={() => approve(campaign.id)}>Approve</button>
                )}
                {campaign.approval && isAdmin && <button style={{ marginLeft: '0.5rem' }} onClick={() => queueSend(campaign.id)}>Queue send</button>}
                {isAdmin && (
                  <>
                    <button style={{ marginLeft: '0.5rem' }} onClick={() => toggleSending(campaign, !campaign.enable_sending)}>
                      {campaign.enable_sending ? 'Disable sending' : 'Enable sending'}
                    </button>
                    {campaign.status !== 'completed' && campaign.status !== 'draft' && (
                      <>
                        {campaign.paused ? (
                          <button style={{ marginLeft: '0.5rem' }} onClick={() => resumeCampaign(campaign.id)}>Resume</button>
                        ) : (
                          <button style={{ marginLeft: '0.5rem' }} onClick={() => pauseCampaign(campaign.id)}>Pause</button>
                        )}
                      </>
                    )}
                  </>
                )}
                {isManager && (
                  <>
                    <button style={{ marginLeft: '0.5rem' }} onClick={() => openTestEmailModal(campaign.id)}>Send Test</button>
                    <button style={{ marginLeft: '0.5rem' }} onClick={() => cloneCampaign(campaign.id)}>Clone</button>
                    <button style={{ marginLeft: '0.5rem' }} onClick={() => downloadCsv(campaign.id)}>Export CSV</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {filteredCampaigns.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 7 : 6}>
                {campaigns.length === 0 ? 'No campaigns yet.' : 'No campaigns match your search criteria.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={{ margin: '0 1rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {testEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #C99E39'
            }}>
              <h2 style={{ margin: 0, color: '#3D000F' }}>Send Test Email</h2>
              <button
                onClick={() => setTestEmailModal(null)}
                style={{
                  background: 'transparent',
                  border: '2px solid #C99E39',
                  color: '#C99E39',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Test Email Address *
              </label>
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="your-email@example.com"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Sample Name
              </label>
              <input
                type="text"
                value={testSampleName}
                onChange={(e) => setTestSampleName(e.target.value)}
                placeholder="John Doe"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Sample Department
              </label>
              <input
                type="text"
                value={testSampleDepartment}
                onChange={(e) => setTestSampleDepartment(e.target.value)}
                placeholder="IT Department"
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={sendTestEmail}
              disabled={sendingTest}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {sendingTest ? 'Sending...' : 'Send Test Email'}
            </button>

            {testEmailStatus && (
              <div style={{
                padding: '1rem',
                borderRadius: '6px',
                background: testEmailStatus.includes('Error') ? '#fee2e2' : '#d1fae5',
                color: testEmailStatus.includes('Error') ? '#dc2626' : '#059669',
                border: `1px solid ${testEmailStatus.includes('Error') ? '#fca5a5' : '#6ee7b7'}`,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}>
                {testEmailStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SimulationPanel({ campaignId, onSimulated }) {
  const { apiCall, isManager } = useAuth();
  const [rates, setRates] = useState({ openRate: 60, clickRate: 30, submitRate: 10 });
  const [simulating, setSimulating] = useState(false);
  const [message, setMessage] = useState('');

  const updateRate = (key, value) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    setRates(prev => ({ ...prev, [key]: numValue }));
  };

  const runSimulation = async () => {
    setSimulating(true);
    setMessage('');
    try {
      const response = await apiCall(`/api/campaigns/${campaignId}/simulate`, {
        method: 'POST',
        body: JSON.stringify({
          openRate: rates.openRate / 100,
          clickRate: rates.clickRate / 100,
          submitRate: rates.submitRate / 100
        })
      });
      setMessage(`Simulation completed! Generated ${response.stats.delivered} deliveries, ${response.stats.opened} opens, ${response.stats.clicked} clicks, ${response.stats.submitted} submits`);
      onSimulated();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const clearSimulation = async () => {
    if (!confirm('Clear all simulated events for this campaign?')) return;
    try {
      const response = await apiCall(`/api/campaigns/${campaignId}/simulate`, {
        method: 'DELETE'
      });
      setMessage(`Cleared ${response.deleted} simulated events`);
      onSimulated();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  if (!isManager) return null;

  return (
    <div className="card simulation-panel">
      <h3>Simulation Engine</h3>
      <p>Generate simulated employee engagement events for testing</p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <strong>Open Rate:</strong> {rates.openRate}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={rates.openRate}
          onChange={e => updateRate('openRate', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <strong>Click Rate:</strong> {rates.clickRate}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={rates.clickRate}
          onChange={e => updateRate('clickRate', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <strong>Submit Rate:</strong> {rates.submitRate}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={rates.submitRate}
          onChange={e => updateRate('submitRate', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={runSimulation} disabled={simulating}>
          {simulating ? 'Simulating...' : 'Run Simulation'}
        </button>
        <button onClick={clearSimulation} disabled={simulating}>
          Clear Simulated Data
        </button>
      </div>

      {message && <p style={{ marginTop: '1rem', color: message.includes('Error') ? '#dc2626' : '#059669' }}>{message}</p>}
    </div>
  );
}

function CampaignAnalytics({ campaignId }) {
  const { apiCall } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const refreshStats = () => {
    if (!campaignId) return;
    apiCall(`/api/campaigns/${campaignId}/analytics`)
      .then(setStats)
      .catch(err => setError(err.message));
  };

  useEffect(() => {
    refreshStats();
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
    <>
      <SimulationPanel campaignId={campaignId} onSimulated={refreshStats} />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Campaign Analytics</h2>
          <button
            onClick={async () => {
              try {
                const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
                const response = await fetch(`${API_BASE}/api/reports/campaign/${campaignId}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                  }
                });

                if (!response.ok) {
                  throw new Error('Failed to generate report');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `campaign-${campaignId}-report.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                alert('Failed to download PDF: ' + error.message);
              }
            }}
            style={{ background: '#C99E39', color: '#fff', padding: '0.75rem 1.5rem' }}
          >
            📄 Download PDF Report
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Real Events</h3>
          <p>Delivered: {stats.delivered} · Opened: {stats.opened} · Clicked: {stats.clicked} · Submitted: {stats.submitted}</p>
          <div className="flex">
            <RateBar label="Open rate" value={stats.openRate} />
            <RateBar label="Click rate" value={stats.clickRate} />
            <RateBar label="Click-to-submit" value={stats.submitRate} />
          </div>
        </div>

        {stats.hasSimulated && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <h3>Simulated Events <span className="simulation-badge">TEST DATA</span></h3>
            <p>Delivered: {stats.simDelivered} · Opened: {stats.simOpened} · Clicked: {stats.simClicked} · Submitted: {stats.simSubmitted}</p>
            <div className="flex">
              <RateBar label="Open rate" value={stats.simOpenRate} />
              <RateBar label="Click rate" value={stats.simClickRate} />
              <RateBar label="Click-to-submit" value={stats.simSubmitRate} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AppContent() {
  const { apiCall, user, logout } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [allowlist, setAllowlist] = useState({ employees: [], doNotSendDomains: [] });
  const [groups, setGroups] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analyticsView, setAnalyticsView] = useState('campaigns');

  const refreshTemplates = () => {
    apiCall('/api/templates').then(setTemplates).catch(console.error);
  };

  const refreshAllowlist = () => {
    apiCall('/api/allowlist').then(setAllowlist).catch(console.error);
  };

  const refreshGroups = () => {
    apiCall('/api/groups').then(setGroups).catch(console.error);
  };

  const refreshCampaigns = () => {
    apiCall('/api/campaigns').then(data => {
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
    refreshGroups();
    refreshCampaigns();
  }, []);

  return (
    <div>
      <header>
        <div>
          <h1>Phishing Detection Awareness Admin</h1>
          <p>For internal employee training only. Require HR approval before launching a campaign.</p>
        </div>
        <div className="user-info">
          <span>
            <strong>{user?.username}</strong> ({user?.role})
          </span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>
      <TabNav activeTab={activeTab} onChange={setActiveTab} />
      <main>
        {activeTab === 'dashboard' && (
          <Dashboard allowlist={allowlist} campaigns={campaigns} />
        )}

        {activeTab === 'campaigns' && (
          <>
            <CampaignForm
              templates={templates}
              allowlist={allowlist}
              onCreated={() => {
                refreshCampaigns();
                setEditingCampaign(null);
              }}
              editingCampaign={editingCampaign}
              onCancelEdit={() => setEditingCampaign(null)}
            />
            <CampaignList
              campaigns={campaigns}
              onRefresh={refreshCampaigns}
              onEdit={setEditingCampaign}
            />
          </>
        )}

        {activeTab === 'allowlist' && (
          <AllowlistManager allowlist={allowlist} refresh={refreshAllowlist} />
        )}

        {activeTab === 'groups' && (
          <GroupsManager groups={groups} allowlist={allowlist} refresh={refreshGroups} />
        )}

        {activeTab === 'analytics' && (
          <>
            <div className="card">
              <h2>Analytics</h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setAnalyticsView('campaigns')}
                  style={{
                    background: analyticsView === 'campaigns' ? '#C99E39' : 'transparent',
                    border: '2px solid #C99E39',
                    color: analyticsView === 'campaigns' ? '#3D000F' : '#C99E39'
                  }}
                >
                  Campaign Analytics
                </button>
                <button
                  onClick={() => setAnalyticsView('employees')}
                  style={{
                    background: analyticsView === 'employees' ? '#C99E39' : 'transparent',
                    border: '2px solid #C99E39',
                    color: analyticsView === 'employees' ? '#3D000F' : '#C99E39'
                  }}
                >
                  Employee Analytics
                </button>
                <button
                  onClick={() => setAnalyticsView('trends')}
                  style={{
                    background: analyticsView === 'trends' ? '#C99E39' : 'transparent',
                    border: '2px solid #C99E39',
                    color: analyticsView === 'trends' ? '#3D000F' : '#C99E39'
                  }}
                >
                  Trends
                </button>
                <button
                  onClick={() => setAnalyticsView('compare')}
                  style={{
                    background: analyticsView === 'compare' ? '#C99E39' : 'transparent',
                    border: '2px solid #C99E39',
                    color: analyticsView === 'compare' ? '#3D000F' : '#C99E39'
                  }}
                >
                  Compare Campaigns
                </button>
                <button
                  onClick={() => setAnalyticsView('departments')}
                  style={{
                    background: analyticsView === 'departments' ? '#C99E39' : 'transparent',
                    border: '2px solid #C99E39',
                    color: analyticsView === 'departments' ? '#3D000F' : '#C99E39'
                  }}
                >
                  Department Risk
                </button>
                <button
                  onClick={() => setAnalyticsView('repeat-offenders')}
                  style={{
                    background: analyticsView === 'repeat-offenders' ? '#C99E39' : 'transparent',
                    border: '2px solid #C99E39',
                    color: analyticsView === 'repeat-offenders' ? '#3D000F' : '#C99E39'
                  }}
                >
                  Repeat Offenders
                </button>
              </div>
            </div>

            {analyticsView === 'campaigns' && (
              <>
                <div className="card">
                  <h3>Select campaign for analytics</h3>
                  <select value={selectedCampaign || ''} onChange={event => setSelectedCampaign(event.target.value ? Number(event.target.value) : null)}>
                    <option value="">Select</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                    ))}
                  </select>
                </div>
                <CampaignAnalytics campaignId={selectedCampaign} />
              </>
            )}

            {analyticsView === 'employees' && (
              <EmployeeAnalytics />
            )}

            {analyticsView === 'trends' && (
              <TrendsAnalytics />
            )}

            {analyticsView === 'compare' && (
              <CompareAnalytics campaigns={campaigns} />
            )}

            {analyticsView === 'departments' && (
              <DepartmentRiskScoring />
            )}

            {analyticsView === 'repeat-offenders' && (
              <RepeatOffenders />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppWrapper />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppWrapper() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <h1>Phish Train Lite</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AppContent />;
}
