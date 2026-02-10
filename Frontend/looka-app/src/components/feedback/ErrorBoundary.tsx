import React from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
          <div className="w-20 h-20 rounded-full bg-error-light flex items-center justify-center mb-6">
            <Icon name="error_outline" className="text-5xl text-error" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">
            出错了
          </h1>
          <p className="text-sm text-text-secondary text-center mb-6 max-w-xs">
            很抱歉，应用遇到了一些问题。请尝试刷新页面或稍后再试。
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-6 max-w-sm w-full">
              <summary className="text-sm text-text-secondary cursor-pointer mb-2">
                错误详情
              </summary>
              <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-40">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={this.handleReset}>
              重试
            </Button>
            <Button variant="primary" onClick={this.handleReload}>
              刷新页面
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 页面级别错误边界
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mb-4">
            <Icon name="error_outline" className="text-4xl text-error" />
          </div>
          <h2 className="text-base font-medium text-text-primary mb-1">
            页面加载失败
          </h2>
          <p className="text-sm text-text-secondary text-center mb-4">
            请刷新页面重试
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// 组件级别错误边界
export function ComponentErrorBoundary({
  children,
  name = '组件',
}: {
  children: React.ReactNode;
  name?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg">
          <Icon name="warning" className="text-3xl text-warning mb-2" />
          <p className="text-sm text-text-secondary">{name}加载失败</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
