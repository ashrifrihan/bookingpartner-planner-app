'use client';

import { Component, ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    try {
      if (typeof window !== 'undefined') {
        // Clear corrupted planner keys if needed
        window.location.reload();
      }
    } catch {
      this.setState({ hasError: false, error: null });
    }
  };

  handleSafeResetStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bp-planner-items-v1');
        localStorage.removeItem('bp-planner-notes-v1');
        localStorage.removeItem('bp-planner-blocked-v1');
        window.location.reload();
      }
    } catch {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main className="auth-shell">
          <section className="auth-card" style={{ maxWidth: 480 }}>
            <div className="auth-brand-center">
              <img
                src="/bookingpartner.png"
                alt="BookingPartner.lk"
                className="brand-mark"
                width={52}
                height={52}
              />
            </div>
            <p className="eyebrow" style={{ color: 'var(--red-accent)' }}>APPLICATION NOTICE</p>
            <h1 style={{ fontSize: '22px' }}>Something went wrong</h1>
            <p className="muted">
              The planner encountered an unexpected rendering error. Your data is safe.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'var(--surface-card-subtle)',
                  border: '1px solid var(--line-subtle)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'var(--ink-secondary)',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  margin: '8px 0 16px',
                  overflowX: 'auto',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                className="primary-button"
                onClick={this.handleReset}
              >
                Reload Application
              </button>

              <button
                type="button"
                className="text-button"
                onClick={this.handleSafeResetStorage}
              >
                Clear Local Cache & Reset
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
