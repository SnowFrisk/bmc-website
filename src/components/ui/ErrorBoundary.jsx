import { Component } from 'react'
import btnStyles from './buttons.module.css'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-primary)',
          backgroundColor: 'var(--bg-primary)',
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: '1rem' }}>
            發生錯誤
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            應用程式發生未預期的錯誤，請嘗試重新整理頁面。
          </p>
          <button
            onClick={() => window.location.reload()}
            className={btnStyles.btnSecondary}
            style={{ padding: '0.5rem 1.5rem', fontSize: 14, borderRadius: 6 }}
          >
            重新整理
          </button>
          {this.state.error && (
            <pre style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: 6,
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              fontSize: 12,
              maxWidth: '100%',
              overflow: 'auto',
              textAlign: 'left',
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
