import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../contexts/ChatContext.jsx';
import './ContactsPage.css';

const ContactsPage = () => {
  const { t } = useTranslation();
  const { 
    contacts, 
    addContact, 
    blockContact, 
    unblockContact, 
    deleteContact, 
    searchUsers,
    isOnline
  } = useChat();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filtra i contatti in base alla tab attiva
  useEffect(() => {
    if (!contacts) return;
    
    let filtered = [...contacts];
    
    if (activeTab === 'blocked') {
      filtered = filtered.filter(contact => contact.status === 'blocked');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(contact => contact.status === 'pending');
    } else if (activeTab === 'all') {
      filtered = filtered.filter(contact => contact.status !== 'blocked');
    }
    
    setFilteredContacts(filtered);
  }, [contacts, activeTab]);
  
  // Gestisce la ricerca di utenti
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Errore nella ricerca degli utenti:', err);
      setError(t('contacts.searchError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce l'aggiunta di un contatto
  const handleAddContact = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      await addContact(userId);
      
      setSuccess(t('contacts.addSuccess'));
      setSearchResults([]);
      setSearchQuery('');
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Errore nell\'aggiunta del contatto:', err);
      setError(t('contacts.addError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce il blocco di un contatto
  const handleBlockContact = async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      
      await blockContact(contactId);
      
      setSuccess(t('contacts.blockSuccess'));
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Errore nel blocco del contatto:', err);
      setError(t('contacts.blockError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce lo sblocco di un contatto
  const handleUnblockContact = async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      
      await unblockContact(contactId);
      
      setSuccess(t('contacts.unblockSuccess'));
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Errore nello sblocco del contatto:', err);
      setError(t('contacts.unblockError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce l'eliminazione di un contatto
  const handleDeleteContact = async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteContact(contactId);
      
      setSuccess(t('contacts.deleteSuccess'));
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Errore nell\'eliminazione del contatto:', err);
      setError(t('contacts.deleteError'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="contacts-page">
      <div className="contacts-container">
        <h1>{t('contacts.title')}</h1>
        
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('contacts.searchPlaceholder')}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              className="search-button"
              onClick={handleSearch}
              disabled={loading}
            >
              {t('contacts.search')}
            </button>
          </div>
          
          {loading && (
            <div className="loading-indicator">
              {t('contacts.searching')}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              {success}
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>{t('contacts.searchResults')}</h3>
              
              <div className="results-list">
                {searchResults.map(user => (
                  <div key={user._id} className="result-item">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.displayName || user.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {(user.displayName || user.username || user.walletAddress)[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.displayName || user.username || user.walletAddress}
                        </div>
                        {user.username && user.username !== user.displayName && (
                          <div className="user-username">@{user.username}</div>
                        )}
                      </div>
                    </div>
                    <button 
                      className="add-button"
                      onClick={() => handleAddContact(user._id)}
                      disabled={loading}
                    >
                      {t('contacts.add')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="contacts-tabs">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {t('contacts.tabs.all')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            {t('contacts.tabs.pending')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'blocked' ? 'active' : ''}`}
            onClick={() => setActiveTab('blocked')}
          >
            {t('contacts.tabs.blocked')}
          </button>
        </div>
        
        <div className="contacts-list">
          {filteredContacts.length === 0 ? (
            <div className="no-contacts">
              {activeTab === 'blocked' 
                ? t('contacts.noBlockedContacts')
                : activeTab === 'pending'
                  ? t('contacts.noPendingContacts')
                  : t('contacts.noContacts')}
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div key={contact._id} className="contact-item">
                <div className="contact-info">
                  <div className="contact-avatar">
                    {contact.contact.profilePicture ? (
                      <img src={contact.contact.profilePicture} alt={contact.contact.displayName || contact.contact.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {(contact.contact.displayName || contact.contact.username || contact.contact.walletAddress)[0].toUpperCase()}
                      </div>
                    )}
                    {isOnline(contact.contact._id) && (
                      <div className="online-indicator" />
                    )}
                  </div>
                  <div className="contact-details">
                    <div className="contact-name">
                      {contact.nickname || contact.contact.displayName || contact.contact.username || contact.contact.walletAddress}
                    </div>
                    {contact.contact.username && (
                      <div className="contact-username">@{contact.contact.username}</div>
                    )}
                    <div className="contact-status">
                      {contact.status === 'pending' && t('contacts.statusPending')}
                      {contact.status === 'blocked' && t('contacts.statusBlocked')}
                    </div>
                  </div>
                </div>
                <div className="contact-actions">
                  {contact.status === 'blocked' ? (
                    <button 
                      className="unblock-button"
                      onClick={() => handleUnblockContact(contact._id)}
                      disabled={loading}
                    >
                      {t('contacts.unblock')}
                    </button>
                  ) : (
                    <button 
                      className="block-button"
                      onClick={() => handleBlockContact(contact._id)}
                      disabled={loading}
                    >
                      {t('contacts.block')}
                    </button>
                  )}
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteContact(contact._id)}
                    disabled={loading}
                  >
                    {t('contacts.delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;
