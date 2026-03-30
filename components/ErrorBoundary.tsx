import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-amber-500 mb-4"></i>
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">组件加载出错</h3>
          <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text mb-4 max-w-md">{this.state.error?.message || '未知错误'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors text-sm"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
