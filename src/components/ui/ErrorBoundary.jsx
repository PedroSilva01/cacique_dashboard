import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // You can also log the error to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 m-4">
          <h3 className="font-bold text-lg mb-2">Algo deu errado</h3>
          <p className="mb-2">Ocorreu um erro inesperado. Por favor, recarregue a página ou tente novamente mais tarde.</p>
          {this.state.error && (
            <details className="text-sm text-red-600 mt-2">
              <summary>Detalhes do erro</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = (WrappedComponent) => {
  return (props) => (
    <ErrorBoundary>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
};
