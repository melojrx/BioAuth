import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode is removed to prevent double-loading models in dev, though robust code handles it.
  // Keeping it simple for face-api model loading stability.
  <App />
);