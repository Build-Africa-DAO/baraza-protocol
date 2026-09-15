import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import StatusPage from '@/components/StatusPage';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
  resetKey: number;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Baraza render error', error, info.componentStack);
  }

  private retry = () => {
    this.setState((current) => ({ error: null, resetKey: current.resetKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background">
          <StatusPage
            kind="server"
            onRetry={this.retry}
            details={
              import.meta.env.DEV ? (
                <p className="font-mono text-[11px] text-muted-foreground">{this.state.error.message}</p>
              ) : null
            }
          />
        </div>
      );
    }

    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}
