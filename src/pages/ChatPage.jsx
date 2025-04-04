import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../contexts/ChatContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ContactInfo from '../components/ContactInfo';
import './ChatPage.css';

const ChatPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { 
    contacts, 
    activeConversation, 
    setActiveConversation, 
    loadConversation,
    conversations,
    sendMessage,
    sendTypingNotification,
    isOnline,
    isTyping
  } = useChat();
  
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  
  // Filtra i contatti in base alla query di ricerca
  useEffect(() => {
    if (!contacts) return;
    
    if (!searchQuery) {
      setFilteredContacts(contacts);
      return;
    }
    
    const filtered = contacts.filter(contact => {
      const contactUser = contact.contact;
      const query = searchQuery.toLowerCase();
      
      return (
        contactUser.username?.toLowerCase().includes(query) ||
        contactUser.displayName?.toLowerCase().includes(query) ||
        contactUser.walletAddress?.toLowerCase().includes(query) ||
        contact.nickname?.toLowerCase().includes(query)
      );
    });
    
    setFilteredContacts(filtered);
  }, [contacts, searchQuery]);
  
  // Gestisce il click su un contatto
  const handleContactClick = (contactId) => {
    setActiveConversation(contactId);
    loadConversation(contactId);
    setShowContactInfo(false);
  };
  
  // Gestisce l'invio di un messaggio
  const handleSendMessage = (message, attachments = []) => {
    if (!activeConversation || !message.trim()) return;
    
    sendMessage(activeConversation, message, attachments);
  };
  
  // Gestisce la notifica di digitazione
  const handleTyping = (isTyping) => {
    if (!activeConversation) return;
    
    sendTypingNotification(activeConversation, isTyping);
  };
  
  // Trova il contatto attivo
  const activeContact = contacts?.find(
    contact => contact.contact._id === activeConversation
  );
  
  // Trova i messaggi della conversazione attiva
  const activeMessages = activeConversation ? conversations[activeConversation] || [] : [];
  
  return (
    <div className="chat-page">
      <Sidebar 
        contacts={filteredContacts}
        activeContactId={activeConversation}
        onContactClick={handleContactClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOnline={isOnline}
        currentUser={user}
      />
      
      {activeConversation ? (
        <>
          <ChatWindow 
            messages={activeMessages}
            contact={activeContact?.contact}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            isOnline={isOnline(activeConversation)}
            isTyping={isTyping(activeConversation)}
            currentUser={user}
            onInfoClick={() => setShowContactInfo(true)}
          />
          
          {showContactInfo && (
            <ContactInfo 
              contact={activeContact}
              onClose={() => setShowContactInfo(false)}
              isOnline={isOnline(activeConversation)}
            />
          )}
        </>
      ) : (
        <div className="no-conversation">
          <div className="no-conversation-content">
            <h2>{t('chat.noConversation.title')}</h2>
            <p>{t('chat.noConversation.description')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
