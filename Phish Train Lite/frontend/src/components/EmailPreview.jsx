import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function EmailPreview({ templateKey, customSubject, customBody, onClose }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sampleName, setSampleName] = useState('John Doe');
  const [sampleDepartment, setSampleDepartment] = useState('IT Department');
  const { apiCall } = useAuth();

  async function loadPreview() {
    try {
      setLoading(true);
      const data = await apiCall('/api/preview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey,
          customSubject,
          customBody,
          sampleName,
          sampleDepartment
        })
      });
      setPreview(data);
    } catch (error) {
      console.error('Failed to load preview:', error);
      alert('Failed to load email preview');
    } finally {
      setLoading(false);
    }
  }

  // Load preview on mount and when sample data changes
  useEffect(() => {
    loadPreview();
  }, [templateKey, customSubject, customBody, sampleName, sampleDepartment]);

  return (
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
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid #C99E39',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#3D000F',
          color: '#fff',
          borderRadius: '12px 12px 0 0'
        }}>
          <h2 style={{ margin: 0, color: '#C99E39' }}>Email Preview</h2>
          <button
            onClick={onClose}
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

        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem', background: 'rgba(201, 158, 57, 0.1)', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #C99E39' }}>
            <h3 style={{ marginTop: 0, color: '#3D000F' }}>Sample Data</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label><strong>Sample Name:</strong></label>
                <input
                  type="text"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  placeholder="John Doe"
                  style={{ marginTop: '0.5rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label><strong>Sample Department:</strong></label>
                <input
                  type="text"
                  value={sampleDepartment}
                  onChange={(e) => setSampleDepartment(e.target.value)}
                  placeholder="IT Department"
                  style={{ marginTop: '0.5rem' }}
                />
              </div>
            </div>
            <button
              onClick={loadPreview}
              disabled={loading}
              style={{ width: 'auto' }}
            >
              {loading ? 'Loading...' : 'Refresh Preview'}
            </button>
          </div>

          {loading && <p>Loading preview...</p>}

          {preview && !loading && (
            <div>
              <div style={{
                background: '#f5f5f5',
                border: '2px solid #D2CECB',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #D2CECB' }}>
                  <strong style={{ color: '#3D000F' }}>Subject:</strong>
                  <p style={{
                    margin: '0.5rem 0 0 0',
                    padding: '0.75rem',
                    background: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #D2CECB',
                    fontWeight: 'bold',
                    color: '#3D000F'
                  }}>
                    {preview.subject}
                  </p>
                </div>

                <div>
                  <strong style={{ color: '#3D000F' }}>Email Body:</strong>
                  <div style={{
                    margin: '0.5rem 0 0 0',
                    padding: '1rem',
                    background: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #D2CECB',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#3D000F'
                  }}>
                    {preview.body}
                  </div>
                </div>

                {preview.trackingLink && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #D2CECB' }}>
                    <strong style={{ color: '#3D000F' }}>Tracking Link (Example):</strong>
                    <p style={{
                      margin: '0.5rem 0 0 0',
                      padding: '0.75rem',
                      background: '#fff',
                      borderRadius: '4px',
                      border: '1px solid #D2CECB',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#836B69',
                      wordBreak: 'break-all'
                    }}>
                      {preview.trackingLink}
                    </p>
                  </div>
                )}
              </div>

              <div style={{
                background: 'rgba(201, 158, 57, 0.1)',
                padding: '1rem',
                borderRadius: '6px',
                borderLeft: '4px solid #C99E39'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#3D000F' }}>
                  <strong>Note:</strong> This is a preview with sample data. Actual emails will use real employee names and departments. The tracking link shown is an example - each email will have a unique tracking token.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
