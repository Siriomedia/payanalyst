import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: The import for App.tsx was pointing to an empty file in the root directory.
// Updated the path to point to the correct App.tsx file located within the 'src' directory.
import App from './src/App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);