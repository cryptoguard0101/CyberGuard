import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Enforce HTTPS - Removed for local/LXC deployment compatibility
// if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
//     window.location.href = 'https://' + window.location.hostname + window.location.pathname + window.location.search;
// }

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