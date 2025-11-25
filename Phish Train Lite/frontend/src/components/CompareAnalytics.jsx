import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function CompareAnalytics({ campaigns }) {
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { apiCall } = useAuth();

  async function fetchComparison() {
    if (selectedCampaigns.length === 0) {
      setComparisonData(null);
      return;
    }

    try {
      setLoading(true);
      const ids = selectedCampaigns.join(',');
      const data = await apiCall(`/api/analytics/compare?ids=${ids}`);
      setComparisonData(data);
    } catch (error) {
      console.error('Failed to fetch comparison:', error);
      alert('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }

  function toggleCampaign(campaignId) {
    setSelectedCampaigns(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      } else {
        if (prev.length >= 5) {
          alert('You can compare up to 5 campaigns at a time');
          return prev;
        }
        return [...prev, campaignId];
      }
    });
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  return (
    <div>
      <div className="card">
        <h2>Campaign Comparison</h2>
        <p>Select up to 5 campaigns to compare side by side</p>

        <div style={{ marginTop: '1.5rem' }}>
          <h3>Available Campaigns</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {campaigns.length === 0 ? (
              <p>No campaigns available</p>
            ) : (
              campaigns.map(campaign => (
                <label key={campaign.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(campaign.id)}
                    onChange={() => toggleCampaign(campaign.id)}
                    style={{ marginRight: '0.5rem', cursor: 'pointer', width: 'auto' }}
                  />
                  <span>
                    {campaign.name} ({campaign.status})
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <button
          onClick={fetchComparison}
          disabled={selectedCampaigns.length === 0 || loading}
          style={{ marginTop: '1rem' }}
        >
          {loading ? 'Loading...' : 'Compare Selected Campaigns'}
        </button>
      </div>

      {comparisonData && (
        <>
          <div className="card">
            <h3>Comparison Summary</h3>
            <div className="stat-grid">
              <div className="stat-card">
                <h3>Campaigns Compared</h3>
                <p className="value">{comparisonData.summary.totalCampaigns}</p>
              </div>
              <div className="stat-card">
                <h3>Avg Open Rate</h3>
                <p className="value">{comparisonData.summary.avgOpenRate}%</p>
              </div>
              <div className="stat-card">
                <h3>Avg Click Rate</h3>
                <p className="value">{comparisonData.summary.avgClickRate}%</p>
              </div>
              <div className="stat-card">
                <h3>Avg Submit Rate</h3>
                <p className="value">{comparisonData.summary.avgSubmitRate}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Side-by-Side Metrics</h3>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    {comparisonData.campaigns.map(c => (
                      <th key={c.id}>{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Subject</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>{c.subject}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Scheduled Date</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>{formatDate(c.scheduledTime)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Status</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}><span className="badge">{c.status}</span></td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Delivered</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>{c.metrics.delivered}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Opened</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>{c.metrics.opened}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Clicked</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>{c.metrics.clicked}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Submitted</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>{c.metrics.submitted}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Open Rate</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>
                        <span style={{
                          color: c.metrics.openRate > 50 ? '#44cc44' : c.metrics.openRate > 25 ? '#ff9900' : '#ff4444',
                          fontWeight: 'bold'
                        }}>
                          {c.metrics.openRate}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Click Rate</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>
                        <span style={{
                          color: c.metrics.clickRate > 30 ? '#ff4444' : c.metrics.clickRate > 15 ? '#ff9900' : '#44cc44',
                          fontWeight: 'bold'
                        }}>
                          {c.metrics.clickRate}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Submit Rate</strong></td>
                    {comparisonData.campaigns.map(c => (
                      <td key={c.id}>
                        <span style={{
                          color: c.metrics.submitRate > 50 ? '#ff4444' : c.metrics.submitRate > 25 ? '#ff9900' : '#44cc44',
                          fontWeight: 'bold'
                        }}>
                          {c.metrics.submitRate}%
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {comparisonData.campaigns.some(c => c.departmentBreakdown && c.departmentBreakdown.length > 0) && (
            <div className="card">
              <h3>Department Breakdown Comparison</h3>
              {comparisonData.campaigns.map(campaign => (
                <div key={campaign.id} style={{ marginBottom: '2rem' }}>
                  <h4>{campaign.name}</h4>
                  {campaign.departmentBreakdown && campaign.departmentBreakdown.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Total Employees</th>
                            <th>Clicked</th>
                            <th>Submitted</th>
                            <th>Click Rate</th>
                            <th>Submit Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaign.departmentBreakdown.map(dept => (
                            <tr key={dept.department}>
                              <td>{dept.department}</td>
                              <td>{dept.total}</td>
                              <td>{dept.clicked}</td>
                              <td>{dept.submitted}</td>
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
                  ) : (
                    <p>No department data available</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
