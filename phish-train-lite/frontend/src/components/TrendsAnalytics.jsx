import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function TrendsAnalytics() {
  const [trendsData, setTrendsData] = useState(null);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const { apiCall } = useAuth();

  useEffect(() => {
    fetchTrends();
  }, [period]);

  async function fetchTrends() {
    try {
      setLoading(true);
      const data = await apiCall(`/api/analytics/trends?period=${period}`);
      setTrendsData(data);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      alert('Failed to load trends data');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  if (loading) {
    return <div className="card">Loading trends data...</div>;
  }

  if (!trendsData) {
    return <div className="card">No trends data available</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Campaign Performance Trends</h2>
        <p>View campaign performance metrics over time</p>

        <div style={{ marginTop: '1rem' }}>
          <label>
            <strong>Time Period:</strong>
          </label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ marginLeft: '1rem', width: 'auto' }}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {trendsData.totalCampaigns === 0 ? (
        <div className="card">
          <p>No campaigns found in the selected time period</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h3>Aggregate Performance ({trendsData.period} days)</h3>
            <div className="stat-grid">
              <div className="stat-card">
                <h3>Total Campaigns</h3>
                <p className="value">{trendsData.totalCampaigns}</p>
              </div>
              <div className="stat-card">
                <h3>Total Delivered</h3>
                <p className="value">{trendsData.aggregate.delivered}</p>
              </div>
              <div className="stat-card">
                <h3>Average Open Rate</h3>
                <p className="value">{trendsData.aggregate.openRate}%</p>
              </div>
              <div className="stat-card">
                <h3>Average Click Rate</h3>
                <p className="value">{trendsData.aggregate.clickRate}%</p>
              </div>
              <div className="stat-card">
                <h3>Average Submit Rate</h3>
                <p className="value">{trendsData.aggregate.submitRate}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Campaign Timeline</h3>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Date</th>
                    <th>Status</th>
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
                  {trendsData.campaigns.map(campaign => (
                    <tr key={campaign.campaignId}>
                      <td>{campaign.campaignName}</td>
                      <td>{formatDate(campaign.scheduledTime)}</td>
                      <td>
                        <span className="badge">{campaign.status}</span>
                      </td>
                      <td>{campaign.delivered}</td>
                      <td>{campaign.opened}</td>
                      <td>{campaign.clicked}</td>
                      <td>{campaign.submitted}</td>
                      <td>
                        <span style={{
                          color: campaign.openRate > 50 ? '#44cc44' : campaign.openRate > 25 ? '#ff9900' : '#ff4444',
                          fontWeight: 'bold'
                        }}>
                          {campaign.openRate}%
                        </span>
                      </td>
                      <td>
                        <span style={{
                          color: campaign.clickRate > 30 ? '#ff4444' : campaign.clickRate > 15 ? '#ff9900' : '#44cc44',
                          fontWeight: 'bold'
                        }}>
                          {campaign.clickRate}%
                        </span>
                      </td>
                      <td>
                        <span style={{
                          color: campaign.submitRate > 50 ? '#ff4444' : campaign.submitRate > 25 ? '#ff9900' : '#44cc44',
                          fontWeight: 'bold'
                        }}>
                          {campaign.submitRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>Performance Visualization</h3>
            <div style={{ marginTop: '1.5rem' }}>
              {trendsData.campaigns.map((campaign, idx) => (
                <div key={campaign.campaignId} style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>
                    {campaign.campaignName} ({formatDate(campaign.scheduledTime)})
                  </h4>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Open Rate: {campaign.openRate}%</strong>
                    <div className="chart-bar">
                      <div
                        className="chart-bar-inner"
                        style={{
                          width: `${campaign.openRate}%`,
                          background: campaign.openRate > 50 ? '#44cc44' : campaign.openRate > 25 ? '#ff9900' : '#ff4444'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Click Rate: {campaign.clickRate}%</strong>
                    <div className="chart-bar">
                      <div
                        className="chart-bar-inner"
                        style={{
                          width: `${campaign.clickRate}%`,
                          background: campaign.clickRate > 30 ? '#ff4444' : campaign.clickRate > 15 ? '#ff9900' : '#44cc44'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Submit Rate: {campaign.submitRate}%</strong>
                    <div className="chart-bar">
                      <div
                        className="chart-bar-inner"
                        style={{
                          width: `${campaign.submitRate}%`,
                          background: campaign.submitRate > 50 ? '#ff4444' : campaign.submitRate > 25 ? '#ff9900' : '#44cc44'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
