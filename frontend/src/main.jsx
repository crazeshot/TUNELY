/**
 * main.jsx — Application entry point
 *
 * Mounts the React app into the #root div defined in index.html.
 * StrictMode is enabled to surface potential issues during development.
 * Global CSS (Tailwind + custom vars) is imported here.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
