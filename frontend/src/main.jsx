import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ERPProvider } from './context/ERPContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ERPProvider>
          <App />
        </ERPProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
