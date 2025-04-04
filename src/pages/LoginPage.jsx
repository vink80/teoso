import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletConnection } from '../contexts/WalletConnectionContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import './LoginPage.css';

const LoginPage = () => {
  const { t } = useTranslation();
  const { connected, walletAddress } = useWalletConnection();
  const { loading, error, isAuthenticated } = useAuth();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Animazione all'avvio
    setAnimate(true);
  }, []);

  return (
    <div className={`login-container ${animate ? 'animate' : ''}`}>
      <div className="login-card">
        <div className="login-header">
          <h1>TellOnSol</h1>
          <p className="tagline">{t('login.tagline')}</p>
        </div>

        <div className="wallet-section">
          <h2>{t('login.connectWallet')}</h2>
          <p>{t('login.selectWallet')}</p>
          
          <div className="wallet-button-container">
            <WalletMultiButton />
          </div>
          
          {connected && walletAddress && (
            <div className="wallet-info">
              <p>{t('login.connectedWith')}</p>
              <p className="wallet-address">{walletAddress}</p>
            </div>
          )}
          
          {loading && (
            <div className="loading-indicator">
              <p>{t('login.authenticating')}</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
        </div>
        
        <div className="login-footer">
          <p>{t('login.secureMessaging')}</p>
          <p className="copyright">© 2025 TellOnSol</p>
        </div>
      </div>
      
      <div className="login-features">
        <div className="feature">
          <h3>{t('login.features.encryption.title')}</h3>
          <p>{t('login.features.encryption.description')}</p>
        </div>
        <div className="feature">
          <h3>{t('login.features.wallets.title')}</h3>
          <p>{t('login.features.wallets.description')}</p>
        </div>
        <div className="feature">
          <h3>{t('login.features.privacy.title')}</h3>
          <p>{t('login.features.privacy.description')}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
