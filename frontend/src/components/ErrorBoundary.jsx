import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Tunely ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#141518',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#1e1e24',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid #27272a',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
              Something went wrong loading Tunely
            </h2>
            <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '20px', lineHeight: 1.5 }}>
              The application encountered an unexpected state. You can reload or reset stored cache.
            </p>

            {this.state.error && (
              <pre
                style={{
                  background: '#121215',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f87171',
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: '140px',
                  marginBottom: '24px',
                  border: '1px solid #3f3f46',
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#ffffff',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reload App
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#27272a',
                  color: '#e4e4e7',
                  fontWeight: 500,
                  fontSize: '14px',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  border: '1px solid #3f3f46',
                  cursor: 'pointer',
                }}
              >
                Reset App Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
