import React from 'react';

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode; },
    { hasError: boolean; error?: Error; }
> {
    constructor(props: { children: React.ReactNode; }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h1>Something went wrong</h1>
                    <details>
                        <summary>Error details</summary>
                        <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '10px' }}>
                            {this.state.error?.stack}
                        </pre>
                    </details>
                    <button onClick={() => window.location.reload()}>
                        Reload page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
