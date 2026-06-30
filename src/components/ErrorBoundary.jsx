import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

// Catches render errors anywhere below it so one broken page doesn't blank
// the entire admin panel.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Admin render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-5">
              This page hit an unexpected error. You can retry, or go back to the dashboard.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2 mb-5 font-mono break-words">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleReset} className="btn-primary">Retry</button>
              <a href="/" className="btn-secondary">Dashboard</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
