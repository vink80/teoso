import { Buffer } from 'buffer';
window.Buffer = Buffer;
import process from 'process';
window.process = process;
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import { WalletConnectionProvider } from './contexts/WalletConnectionContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ChatProvider } from './contexts/ChatContext.jsx';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Router>
        <WalletConnectionProvider>
          <AuthProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </AuthProvider>
        </WalletConnectionProvider>
      </Router>
    </I18nextProvider>
  </React.StrictMode>
);
