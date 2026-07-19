// Error Boundary – fängt Fehler in Lazy-Loaded Pages ab, 
// zeigt eine Fallback-UI statt die ganze App zu crashen.
import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-500 flex items-center justify-center p-6">
          <div className="card max-w-md text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="font-title text-xl text-red-300">Etwas ist schiefgelaufen</h2>
            <p className="text-sm text-gray-400">
              {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
            </p>
            <p className="text-xs text-gray-600">
              Deine Daten sind sicher. Bitte lade die Seite neu oder kehre zum Dashboard zurück.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleReset} className="btn-secondary flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Erneut versuchen
              </button>
              <a href="/dashboard" className="btn-primary">Zum Dashboard</a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
