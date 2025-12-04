import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DepartmentRiskScoring() {
  const [departmentData, setDepartmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('riskScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const { apiCall } = useAuth();

  useEffect(() => {
    fetchDepartmentRiskScores();
  }, []);

  async function fetchDepartmentRiskScores() {
    try {
      setLoading(true);
      const data = await apiCall('/api/analytics/departments');
      setDepartmentData(data);
    } catch (error) {
      console.error('Failed to fetch department risk scores:', error);
      alert('Failed to load department risk scores');
    } finally {
      setLoading(false);
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

  function getRiskBadgeClass(score) {
    if (score >= 60) return 'badge-high-risk';
    if (score >= 30) return 'badge-medium-risk';
    return 'badge-low-risk';
  }

  function getRiskLevel(score) {
    if (score >= 60) return 'High Risk';
    if (score >= 30) return 'Medium Risk';
    return 'Low Risk';
  }

  if (loading) {
    return <div className="card">Loading department risk scores...</div>;
  }

  if (!departmentData || departmentData.departments.length === 0) {
    return (
      <div className="card">
        <h2>Department Risk Scoring</h2>
        <p>No department data available. Ensure employees have department assignments.</p>
      </div>
    );
  }

  const sortedDepartments = [...departmentData.departments].sort((a, b) => {
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

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2>Department Risk Scoring</h2>
            <p>Analyze security awareness and phishing susceptibility by department</p>
          </div>
          <button
            onClick={async () => {
              try {
                const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
                const response = await fetch(`${API_BASE}/api/reports/departments`, {
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
                a.download = 'department-risk-report.pdf';
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
            📄 Download Department Report
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Organization Summary</h3>
        <div className="stat-grid">
          <div className="stat-card">
            <h3>Total Departments</h3>
            <p className="value">{departmentData.summary.totalDepartments}</p>
          </div>
          <div className="stat-card">
            <h3>Total Employees</h3>
            <p className="value">{departmentData.summary.totalEmployees}</p>
          </div>
          <div className="stat-card">
            <h3>Average Risk Score</h3>
            <p className="value">{departmentData.summary.avgRiskScore}</p>
            <p className="subtitle">{getRiskLevel(departmentData.summary.avgRiskScore)}</p>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)' }}>
            <h3>High Risk Departments</h3>
            <p className="value">{departmentData.summary.highRiskDepartments}</p>
            <p className="subtitle">Risk Score ≥ 60</p>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ff9900 0%, #cc7700 100%)' }}>
            <h3>Medium Risk Departments</h3>
            <p className="value">{departmentData.summary.mediumRiskDepartments}</p>
            <p className="subtitle">30 ≤ Risk Score &lt; 60</p>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #44cc44 0%, #339933 100%)' }}>
            <h3>Low Risk Departments</h3>
            <p className="value">{departmentData.summary.lowRiskDepartments}</p>
            <p className="subtitle">Risk Score &lt; 30</p>
          </div>
        </div>

        {departmentData.summary.highestRiskDept && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '6px', borderLeft: '4px solid #ff4444' }}>
            <strong>Highest Risk:</strong> {departmentData.summary.highestRiskDept}
            <br />
            <strong>Lowest Risk:</strong> {departmentData.summary.lowestRiskDept}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Department Risk Rankings</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                  Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('totalEmployees')} style={{ cursor: 'pointer' }}>
                  Employees {sortField === 'totalEmployees' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('riskScore')} style={{ cursor: 'pointer' }}>
                  Risk Score {sortField === 'riskScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('clickRate')} style={{ cursor: 'pointer' }}>
                  Click Rate {sortField === 'clickRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('submitRate')} style={{ cursor: 'pointer' }}>
                  Submit Rate {sortField === 'submitRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('repeatOffenders')} style={{ cursor: 'pointer' }}>
                  Repeat Offenders {sortField === 'repeatOffenders' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('highRiskEmployees')} style={{ cursor: 'pointer' }}>
                  High Risk Employees {sortField === 'highRiskEmployees' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('recentActivity')} style={{ cursor: 'pointer' }}>
                  Recent Activity (30d) {sortField === 'recentActivity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDepartments.map(dept => (
                <tr key={dept.department}>
                  <td><strong>{dept.department}</strong></td>
                  <td>{dept.totalEmployees}</td>
                  <td>
                    <span className={`badge ${getRiskBadgeClass(dept.riskScore)}`}>
                      {dept.riskScore} - {getRiskLevel(dept.riskScore)}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      color: dept.clickRate > 30 ? '#ff4444' : dept.clickRate > 15 ? '#ff9900' : '#44cc44',
                      fontWeight: 'bold'
                    }}>
                      {dept.clickRate}%
                    </span>
                  </td>
                  <td>
                    <span style={{
                      color: dept.submitRate > 50 ? '#ff4444' : dept.submitRate > 25 ? '#ff9900' : '#44cc44',
                      fontWeight: 'bold'
                    }}>
                      {dept.submitRate}%
                    </span>
                  </td>
                  <td>{dept.repeatOffenders}</td>
                  <td>
                    <span style={{
                      color: dept.highRiskEmployees > 0 ? '#ff4444' : '#44cc44',
                      fontWeight: 'bold'
                    }}>
                      {dept.highRiskEmployees}
                    </span>
                  </td>
                  <td>{dept.recentActivity} clicks</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Risk Score Visualization</h3>
        <div style={{ marginTop: '1.5rem' }}>
          {sortedDepartments.map(dept => (
            <div key={dept.department} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{dept.department}</span>
                <span className={`badge ${getRiskBadgeClass(dept.riskScore)}`}>
                  {dept.riskScore}
                </span>
              </h4>
              <div className="chart-bar">
                <div
                  className="chart-bar-inner"
                  style={{
                    width: `${dept.riskScore}%`,
                    background: dept.riskScore >= 60 ? 'linear-gradient(90deg, #ff4444 0%, #cc0000 100%)'
                      : dept.riskScore >= 30 ? 'linear-gradient(90deg, #ff9900 0%, #cc7700 100%)'
                      : 'linear-gradient(90deg, #44cc44 0%, #339933 100%)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.25rem', color: '#836B69' }}>
                <span>{dept.totalEmployees} employees</span>
                <span>{dept.repeatOffenders} repeat offenders</span>
                <span>{dept.highRiskEmployees} high risk</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Detailed Department Metrics</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Delivered</th>
                <th>Opened</th>
                <th>Clicked</th>
                <th>Submitted</th>
                <th>Open Rate</th>
                <th>Click Rate</th>
                <th>Submit Rate</th>
              </tr>
            </thead>
            <tbody>
              {sortedDepartments.map(dept => (
                <tr key={dept.department}>
                  <td><strong>{dept.department}</strong></td>
                  <td>{dept.delivered}</td>
                  <td>{dept.opened}</td>
                  <td>{dept.clicked}</td>
                  <td>{dept.submitted}</td>
                  <td>{dept.openRate}%</td>
                  <td>
                    <span style={{
                      color: dept.clickRate > 30 ? '#ff4444' : dept.clickRate > 15 ? '#ff9900' : '#44cc44',
                      fontWeight: 'bold'
                    }}>
                      {dept.clickRate}%
                    </span>
                  </td>
                  <td>
                    <span style={{
                      color: dept.submitRate > 50 ? '#ff4444' : dept.submitRate > 25 ? '#ff9900' : '#44cc44',
                      fontWeight: 'bold'
                    }}>
                      {dept.submitRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
