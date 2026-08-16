import { Component } from 'react'
import btnStyles from './buttons.module.css'
import styles from './ErrorBoundary.module.css'

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
        <div className={styles.container}>
          <h1 className={styles.title}>發生錯誤</h1>
          <p className={styles.message}>應用程式發生未預期的錯誤，請嘗試重新整理頁面。</p>
          <button
            onClick={() => window.location.reload()}
            className={`${btnStyles.btnSecondary} ${styles.reloadBtn}`}
          >
            重新整理
          </button>
          {this.state.error && (
            <pre className={styles.details}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
