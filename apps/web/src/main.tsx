import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals.ts';

import './styles.css';

import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';

const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </StrictMode>
    );
} else if (!rootElement) {
    console.error('Root element with id "app" not found');
    throw new Error('Root element with id "app" not found');
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
