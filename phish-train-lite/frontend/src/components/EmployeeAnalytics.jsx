import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function EmployeeAnalytics() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [sortField, setSortField] = useState('riskScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10);
  const { apiCall } = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeDetails(selectedEmployee);
    } else {
      setEmployeeDetails(null);
    }
  }, [selectedEmployee]);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const data = await apiCall('/api/analytics/employees');
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employee analytics:', error);
      alert('Failed to load employee analytics');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmployeeDetails(email) {
    try {
      setDetailsLoading(true);
      const data = await apiCall(`/api/analytics/employees/${encodeURIComponent(email)}`);
      setEmployeeDetails(data);
    } catch (error) {
      console.error('Failed to fetch employee details:', error);
      alert('Failed to load employee details');
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  const sortedEmployees = [...employees].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedEmployees.length / employeesPerPage);
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = sortedEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function getRiskBadgeClass(score) {
    if (score >= 60) return 'badge-high-risk';
    if (score >= 40) return 'badge-medium-risk';
    return 'badge-low-risk';
  }

  function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  if (loading) {
    return <div className="card">Loading employee analytics...</div>;
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2>Employee Security Analytics</h2>
            <p>Track individual employee performance across all phishing campaigns</p>
          </div>
          <button
            onClick={async () => {
              try {
                const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
                const response = await fetch(`${API_BASE}/api/reports/employees`, {
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
                a.download = 'employee-analytics-report.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                alert('Failed to download PDF: ' + error.message);
              }
            }}
            style={{ background: '#C99E39', color: '#fff', padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
          >
            📄 Generate Employee Report
          </button>
        </div>

        {employees.length === 0 ? (
          <p>No employee data available. Run some campaigns first.</p>
        ) : (
          <>
            <p><strong>Total Employees:</strong> {employees.length}</p>
            <p><strong>High Risk Employees:</strong> {employees.filter(e => e.riskScore >= 60).length}</p>
            <p><strong>Medium Risk Employees:</strong> {employees.filter(e => e.riskScore >= 40 && e.riskScore < 60).length}</p>
            <p><strong>Low Risk Employees:</strong> {employees.filter(e => e.riskScore < 40).length}</p>
          </>
        )}
      </div>

      {employees.length > 0 && (
        <div className="card">
          <h3>Employee Risk Scores</h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                    Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('totalCampaigns')} style={{ cursor: 'pointer' }}>
                    Campaigns {sortField === 'totalCampaigns' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('clickRate')} style={{ cursor: 'pointer' }}>
                    Click Rate {sortField === 'clickRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('submitRate')} style={{ cursor: 'pointer' }}>
                    Submit Rate {sortField === 'submitRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('riskScore')} style={{ cursor: 'pointer' }}>
                    Risk Score {sortField === 'riskScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('lastActivity')} style={{ cursor: 'pointer' }}>
                    Last Activity {sortField === 'lastActivity' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map(emp => (
                  <tr key={emp.email} style={{ cursor: 'pointer' }} onClick={() => setSelectedEmployee(emp.email)}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>
                    <td>{emp.totalCampaigns}</td>
                    <td>{emp.clickRate}%</td>
                    <td>{emp.submitRate}%</td>
                    <td>
                      <span className={`badge ${getRiskBadgeClass(emp.riskScore)}`}>
                        {emp.riskScore}
                      </span>
                    </td>
                    <td>{formatDate(emp.lastActivity)}</td>
                    <td>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        console.log('View Details clicked for:', emp.email);
                        setSelectedEmployee(emp.email);
                      }}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div>
              Showing {indexOfFirstEmployee + 1}-{Math.min(indexOfLastEmployee, sortedEmployees.length)} of {sortedEmployees.length} employees
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #C99E39', borderRadius: '4px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="card">
          <h3>Employee Details</h3>
          <button onClick={() => setSelectedEmployee(null)} style={{ marginBottom: '1rem' }}>
            ← Back to List
          </button>

          {detailsLoading ? (
            <p>Loading employee details...</p>
          ) : employeeDetails ? (
            <>
              <div className="employee-details-header">
                <h4>{employeeDetails.employee.name}</h4>
                <p><strong>Email:</strong> {employeeDetails.employee.email}</p>
                <p><strong>Department:</strong> {employeeDetails.employee.department}</p>
                <p><strong>Member Since:</strong> {formatDate(employeeDetails.employee.createdAt)}</p>
              </div>

              <div className="stat-grid" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card">
                  <h3>Total Campaigns</h3>
                  <p className="value">{employeeDetails.statistics.totalCampaigns}</p>
                </div>
                <div className="stat-card">
                  <h3>Opened Rate</h3>
                  <p className="value">{employeeDetails.statistics.openRate}%</p>
                </div>
                <div className="stat-card">
                  <h3>Clicked Rate</h3>
                  <p className="value">{employeeDetails.statistics.clickRate}%</p>
                </div>
                <div className="stat-card">
                  <h3>Submitted Rate</h3>
                  <p className="value">{employeeDetails.statistics.submitRate}%</p>
                </div>
                <div className="stat-card">
                  <h3>Risk Trend</h3>
                  <p className="value">{employeeDetails.statistics.riskTrend}</p>
                  <p className="subtitle">Based on last 5 campaigns</p>
                </div>
              </div>

              <h4 style={{ marginTop: '2rem' }}>Campaign History</h4>
              {employeeDetails.campaignHistory.length === 0 ? (
                <p>No campaign history available</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Subject</th>
                        <th>Scheduled</th>
                        <th>Status</th>
                        <th>Delivered</th>
                        <th>Opened</th>
                        <th>Clicked</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeDetails.campaignHistory.map(campaign => (
                        <tr key={campaign.campaignId}>
                          <td>{campaign.campaignName}</td>
                          <td>{campaign.subject}</td>
                          <td>{formatDate(campaign.scheduledTime)}</td>
                          <td>
                            <span className="badge">{campaign.status}</span>
                          </td>
                          <td>{campaign.delivered ? '✓' : '✗'}</td>
                          <td>
                            {campaign.opened ? (
                              <span style={{ color: '#C99E39' }}>✓ {formatDate(campaign.openedAt)}</span>
                            ) : '✗'}
                          </td>
                          <td>
                            {campaign.clicked ? (
                              <span style={{ color: '#C99E39' }}>✓ {formatDate(campaign.clickedAt)}</span>
                            ) : '✗'}
                          </td>
                          <td>
                            {campaign.submitted ? (
                              <span style={{ color: '#ff4444' }}>✓ {formatDate(campaign.submittedAt)}</span>
                            ) : '✗'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p>No details available</p>
          )}
        </div>
      )}
    </div>
  );
}
