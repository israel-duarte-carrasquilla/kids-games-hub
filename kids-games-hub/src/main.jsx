import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { StorageProvider } from './context/StorageContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StorageProvider>
      <App />
    </StorageProvider>
  </React.StrictMode>
);
