import { Component } from 'react'
import i18n from '../../i18n'
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
          <h1 className={styles.title}>{i18n.t('error.title')}</h1>
          <p className={styles.message}>{i18n.t('error.message')}</p>
          <button
            onClick={() => window.location.reload()}
            className={`${btnStyles.btnSecondary} ${styles.reloadBtn}`}
          >
            {i18n.t('error.reload')}
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
