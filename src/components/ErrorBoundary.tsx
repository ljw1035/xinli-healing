import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('应用运行时错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#F4F6F7',
          fontFamily: 'PingFang-SC, Microsoft YaHei, sans-serif',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '500px',
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💔</div>
            <h2 style={{ color: '#2C3E50', marginBottom: '0.5rem' }}>应用加载出错</h2>
            <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              抱歉，应用在运行时遇到了错误。
              <br />
              请尝试刷新页面，或清除浏览器缓存后重试。
            </p>

            {this.state.error && (
              <details style={{
                textAlign: 'left' as const,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: '#991b1b',
                marginTop: '1rem',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '0.5rem' }}>
                  技术详情（点击展开）
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.25rem',
                padding: '0.75rem 2rem',
                background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
