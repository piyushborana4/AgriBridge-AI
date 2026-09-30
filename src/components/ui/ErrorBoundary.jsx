import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AgriBridge ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                Something went wrong loading this module
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                AgriBridge AI encountered an unexpected rendering error. Your farm telemetry, journal entries, and data remain safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button onClick={this.handleReset} icon={RefreshCw} size="sm" className="w-full sm:w-auto">
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="secondary" icon={Home} size="sm" className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
