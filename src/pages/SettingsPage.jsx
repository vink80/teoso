import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext.jsx';
import './SettingsPage.css';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, getSessions, terminateSession, loading, error } = useAuth();
  
  const [activeTab, setActiveTab] = useState('privacy');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: user?.privacySettings?.profileVisibility || 'public',
    lastSeen: user?.privacySettings?.lastSeen || 'everyone',
    readReceipts: user?.privacySettings?.readReceipts !== false
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: user?.securitySettings?.twoFactorEnabled || false,
    loginNotifications: user?.securitySettings?.loginNotifications !== false
  });
  
  const [language, setLanguage] = useState(user?.language || i18n.language || 'en');
  
  // Carica le sessioni attive
  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const sessionsData = await getSessions();
      setSessions(sessionsData);
    } catch (error) {
      console.error('Errore nel caricamento delle sessioni:', error);
    } finally {
      setLoadingSessions(false);
    }
  };
  
  // Gestisce il cambio di tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'sessions' && sessions.length === 0) {
      loadSessions();
    }
  };
  
  // Gestisce il cambio delle impostazioni di privacy
  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Gestisce il cambio delle impostazioni di sicurezza
  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Gestisce il cambio della lingua
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };
  
  // Gestisce il salvataggio delle impostazioni
  const handleSaveSettings = async () => {
    try {
      await updateProfile({
        privacySettings,
        securitySettings,
        language
      });
      
      setSuccess(true);
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Errore nel salvataggio delle impostazioni:', error);
    }
  };
  
  // Gestisce la terminazione di una sessione
  const handleTerminateSession = async (sessionToken) => {
    try {
      await terminateSession(sessionToken);
      // Ricarica le sessioni
      loadSessions();
    } catch (error) {
      console.error('Errore nella terminazione della sessione:', error);
    }
  };
  
  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>{t('settings.title')}</h1>
        
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => handleTabChange('privacy')}
          >
            {t('settings.tabs.privacy')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => handleTabChange('security')}
          >
            {t('settings.tabs.security')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'language' ? 'active' : ''}`}
            onClick={() => handleTabChange('language')}
          >
            {t('settings.tabs.language')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => handleTabChange('sessions')}
          >
            {t('settings.tabs.sessions')}
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'privacy' && (
            <div className="privacy-settings">
              <h2>{t('settings.privacy.title')}</h2>
              
              <div className="form-group">
                <label>{t('settings.privacy.profileVisibility')}</label>
                <select 
                  name="profileVisibility" 
                  value={privacySettings.profileVisibility}
                  onChange={handlePrivacyChange}
                >
                  <option value="public">{t('settings.privacy.public')}</option>
                  <option value="contacts">{t('settings.privacy.contacts')}</option>
                  <option value="private">{t('settings.privacy.private')}</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>{t('settings.privacy.lastSeen')}</label>
                <select 
                  name="lastSeen" 
                  value={privacySettings.lastSeen}
                  onChange={handlePrivacyChange}
                >
                  <option value="everyone">{t('settings.privacy.everyone')}</option>
                  <option value="contacts">{t('settings.privacy.contacts')}</option>
                  <option value="nobody">{t('settings.privacy.nobody')}</option>
                </select>
              </div>
              
              <div className="form-group checkbox">
                <input 
                  type="checkbox" 
                  id="readReceipts" 
                  name="readReceipts"
                  checked={privacySettings.readReceipts}
                  onChange={handlePrivacyChange}
                />
                <label htmlFor="readReceipts">{t('settings.privacy.readReceipts')}</label>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="security-settings">
              <h2>{t('settings.security.title')}</h2>
              
              <div className="form-group checkbox">
                <input 
                  type="checkbox" 
                  id="twoFactorEnabled" 
                  name="twoFactorEnabled"
                  checked={securitySettings.twoFactorEnabled}
                  onChange={handleSecurityChange}
                />
                <label htmlFor="twoFactorEnabled">{t('settings.security.twoFactor')}</label>
              </div>
              
              <div className="form-group checkbox">
                <input 
                  type="checkbox" 
                  id="loginNotifications" 
                  name="loginNotifications"
                  checked={securitySettings.loginNotifications}
                  onChange={handleSecurityChange}
                />
                <label htmlFor="loginNotifications">{t('settings.security.loginNotifications')}</label>
              </div>
            </div>
          )}
          
          {activeTab === 'language' && (
            <div className="language-settings">
              <h2>{t('settings.language.title')}</h2>
              
              <div className="form-group">
                <label>{t('settings.language.select')}</label>
                <select 
                  name="language" 
                  value={language}
                  onChange={handleLanguageChange}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="it">Italiano</option>
                  <option value="tr">Türkçe</option>
                  <option value="ru">Русский</option>
                  <option value="zh">中文</option>
                  <option value="fr">Français</option>
                  <option value="ja">日本語</option>
                  <option value="ar">العربية</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          )}
          
          {activeTab === 'sessions' && (
            <div className="sessions-settings">
              <h2>{t('settings.sessions.title')}</h2>
              
              {loadingSessions ? (
                <div className="loading-indicator">
                  {t('settings.sessions.loading')}
                </div>
              ) : (
                <div className="sessions-list">
                  {sessions.length === 0 ? (
                    <p>{t('settings.sessions.noSessions')}</p>
                  ) : (
                    sessions.map((session, index) => (
                      <div key={index} className="session-item">
                        <div className="session-info">
                          <div className="session-device">{session.device}</div>
                          <div className="session-date">
                            {new Date(session.lastActive).toLocaleString()}
                          </div>
                        </div>
                        <button 
                          className="terminate-button"
                          onClick={() => handleTerminateSession(session.token)}
                        >
                          {t('settings.sessions.terminate')}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          
          {(activeTab === 'privacy' || activeTab === 'security' || activeTab === 'language') && (
            <div className="settings-actions">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="success-message">
                  {t('settings.saveSuccess')}
                </div>
              )}
              
              <button 
                className="save-button" 
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? t('settings.saving') : t('settings.saveChanges')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
