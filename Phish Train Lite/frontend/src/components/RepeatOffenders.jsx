import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function RepeatOffenders() {
  const [offendersData, setOffendersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState('2');
  const [eventType, setEventType] = useState('clicked');
  const [selectedOffender, setSelectedOffender] = useState(null);
  const { apiCall } = useAuth();

  useEffect(() => {
    fetchRepeatOffenders();
  }, [threshold, eventType]);

  async function fetchRepeatOffenders() {
    try {
      setLoading(true);
      const data = await apiCall(`/api/analytics/repeat-offenders?minCampaigns=${threshold}&eventType=${eventType}`);
      setOffendersData(data);
    } catch (error) {
      console.error('Failed to fetch repeat offenders:', error);
      alert('Failed to load repeat offenders data');
    } finally {
      setLoading(false);
    }
  }

  function getRiskBadgeClass(score) {
    if (score >= 60) return 'badge-high-risk';
    if (score >= 30) return 'badge-medium-risk';
    return 'badge-low-risk';
  }

  function getRiskLevel(score) {
    if (score >= 60) return 'Critical';
    if (score >= 30) return 'Medium';
    return 'Low';
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  if (loading) {
    return <div className="card">Loading repeat offenders data...</div>;
  }

  if (!offendersData) {
    return (
      <div className="card">
        <h2>Repeat Offender Tracking</h2>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Repeat Offender Tracking</h2>
        <p>Identify employees who repeatedly fall for phishing attempts and require additional training</p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <label><strong>Minimum Campaigns:</strong></label>
            <select value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ marginLeft: '0.5rem', width: 'auto' }}>
              <option value="2">2 or more</option>
              <option value="3">3 or more</option>
              <option value="4">4 or more</option>
              <option value="5">5 or more</option>
            </select>
          </div>
          <div>
            <label><strong>Event Type:</strong></label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ marginLeft: '0.5rem', width: 'auto' }}>
              <option value="clicked">Clicked Link</option>
              <option value="submitted">Submitted Credentials</option>
              <option value="opened">Opened Email</option>
            </select>
          </div>
        </div>
      </div>

      {offendersData.summary.totalOffenders === 0 ? (
        <div className="card">
          <p>No repeat offenders found with the selected criteria</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h3>Summary</h3>
            <div className="stat-grid">
              <div className="stat-card">
                <h3>Total Repeat Offenders</h3>
                <p className="value">{offendersData.summary.totalOffenders}</p>
                <p className="subtitle">{threshold}+ campaigns</p>
              </div>
              <div className="stat-card">
                <h3>Avg Campaigns Per Person</h3>
                <p className="value">{offendersData.summary.avgCampaignCount}</p>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)' }}>
                <h3>Critical Risk</h3>
                <p className="value">{offendersData.summary.highRiskCount}</p>
                <p className="subtitle">Risk Score ≥ 60</p>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ff9900 0%, #cc7700 100%)' }}>
                <h3>Submitted Credentials</h3>
                <p className="value">{offendersData.summary.submittedCredentials}</p>
                <p className="subtitle">Highest severity</p>
              </div>
            </div>
          </div>

          {offendersData.departmentBreakdown && offendersData.departmentBreakdown.length > 0 && (
            <div className="card">
              <h3>Top Departments with Repeat Offenders</h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Repeat Offenders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offendersData.departmentBreakdown.map(dept => (
                      <tr key={dept.department}>
                        <td>{dept.department}</td>
                        <td><strong>{dept.count}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <h3>Repeat Offenders List</h3>
            <p style={{ marginBottom: '1rem', color: '#836B69' }}>
              Showing employees who have {eventType === 'clicked' ? 'clicked phishing links' : eventType === 'submitted' ? 'submitted credentials' : 'opened phishing emails'} in {threshold}+ campaigns
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Campaign Count</th>
                    <th>Risk Score</th>
                    <th>First Offense</th>
                    <th>Last Offense</th>
                    <th>Days Since Last</th>
                    <th>Submitted Creds</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offendersData.offenders.map(offender => (
                    <tr key={offender.email}>
                      <td><strong>{offender.name}</strong></td>
                      <td>{offender.email}</td>
                      <td>{offender.department}</td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: offender.campaignCount >= 5 ? '#ff4444' : offender.campaignCount >= 3 ? '#ff9900' : '#3D000F' }}>
                          {offender.campaignCount}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getRiskBadgeClass(offender.riskScore)}`}>
                          {offender.riskScore} - {getRiskLevel(offender.riskScore)}
                        </span>
                      </td>
                      <td>{formatDateShort(offender.firstOffense)}</td>
                      <td>{formatDateShort(offender.lastOffense)}</td>
                      <td>
                        <span style={{ color: offender.daysSinceLast <= 7 ? '#ff4444' : offender.daysSinceLast <= 30 ? '#ff9900' : '#44cc44' }}>
                          {offender.daysSinceLast} days
                        </span>
                      </td>
                      <td>
                        {offender.hasSubmitted ? (
                          <span style={{ color: '#ff4444', fontWeight: 'bold' }}>Yes ({offender.submittedCount})</span>
                        ) : (
                          <span style={{ color: '#44cc44' }}>No</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => setSelectedOffender(offender)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedOffender && (
            <div className="card">
              <h3>Offender Details</h3>
              <button onClick={() => setSelectedOffender(null)} style={{ marginBottom: '1rem' }}>
                ← Back to List
              </button>

              <div className="employee-details-header">
                <h4>{selectedOffender.name}</h4>
                <p><strong>Email:</strong> {selectedOffender.email}</p>
                <p><strong>Department:</strong> {selectedOffender.department}</p>
                <p><strong>Risk Score:</strong> <span className={`badge ${getRiskBadgeClass(selectedOffender.riskScore)}`}>{selectedOffender.riskScore} - {getRiskLevel(selectedOffender.riskScore)}</span></p>
              </div>

              <div className="stat-grid" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card">
                  <h3>Total Campaigns</h3>
                  <p className="value">{selectedOffender.campaignCount}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Events</h3>
                  <p className="value">{selectedOffender.totalEvents}</p>
                </div>
                <div className="stat-card">
                  <h3>Days Active</h3>
                  <p className="value">{selectedOffender.daysSinceFirst}</p>
                  <p className="subtitle">Since first offense</p>
                </div>
                <div className="stat-card">
                  <h3>Last Activity</h3>
                  <p className="value">{selectedOffender.daysSinceLast}</p>
                  <p className="subtitle">Days ago</p>
                </div>
              </div>

              <h4 style={{ marginTop: '2rem' }}>Campaign History</h4>
              {selectedOffender.campaigns && selectedOffender.campaigns.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Scheduled Date</th>
                        <th>Event</th>
                        <th>Event Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOffender.campaigns.map((campaign, idx) => (
                        <tr key={idx}>
                          <td>{campaign.name}</td>
                          <td>{formatDateShort(campaign.scheduledTime)}</td>
                          <td>
                            <span className={`badge ${
                              campaign.eventType === 'submitted' ? 'badge-high-risk' :
                              campaign.eventType === 'clicked' ? 'badge-medium-risk' : ''
                            }`}>
                              {campaign.eventType}
                            </span>
                          </td>
                          <td>{formatDate(campaign.eventTimestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No campaign history available</p>
              )}

              <h4 style={{ marginTop: '2rem' }}>Recent Activity</h4>
              {selectedOffender.recentActivity && selectedOffender.recentActivity.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {selectedOffender.recentActivity.map((activity, idx) => (
                    <li key={idx} style={{ padding: '0.5rem', background: idx % 2 === 0 ? 'rgba(210, 206, 203, 0.2)' : 'transparent', borderRadius: '4px' }}>
                      <strong>{activity.eventType}</strong> - {formatDate(activity.timestamp)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent activity</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
