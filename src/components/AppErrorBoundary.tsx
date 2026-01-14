import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep this lightweight: log for debugging, but render a helpful UI.
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const message =
      this.state.error?.message ||
      "The app failed to load. This is usually caused by a network error or a misconfigured deployment.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-xl w-full rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

