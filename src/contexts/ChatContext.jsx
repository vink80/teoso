import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import cryptoService from '../utils/cryptoService';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  
  const { user, token, isAuthenticated } = useAuth();
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Inizializza il socket quando l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated && token) {
      const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
      
      socketInstance.on('connect', () => {
        console.log('Socket connesso');
        socketInstance.emit('authenticate', token);
      });
      
      socketInstance.on('authenticated', () => {
        console.log('Socket autenticato');
      });
      
      socketInstance.on('authentication_error', (error) => {
        console.error('Errore di autenticazione socket:', error);
      });
      
      socketInstance.on('message:received', handleMessageReceived);
      socketInstance.on('message:read', handleMessageRead);
      socketInstance.on('typing:start', handleTypingStart);
      socketInstance.on('typing:stop', handleTypingStop);
      socketInstance.on('user:online', handleUserOnline);
      socketInstance.on('user:offline', handleUserOffline);
      
      setSocket(socketInstance);
      
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [isAuthenticated, token]);
  
  // Carica i contatti quando l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated]);
  
  // Gestori degli eventi socket
  const handleMessageReceived = async (data) => {
    try {
      // Decripta il messaggio
      const decryptedContent = await cryptoService.decryptMessage(
        data.senderId,
        data.encryptedContent
      );
      
      // Aggiorna la conversazione
      setConversations(prev => {
        const conversation = prev[data.senderId] || [];
        return {
          ...prev,
          [data.senderId]: [
            ...conversation,
            {
              _id: data.messageId,
              sender: data.senderId,
              recipient: user._id,
              content: decryptedContent,
              encryptedContent: data.encryptedContent,
              timestamp: data.timestamp,
              read: false,
              delivered: true,
              attachments: data.attachments || []
            }
          ]
        };
      });
      
      // Invia conferma di consegna
      if (socket) {
        socket.emit('message:delivered', {
          messageId: data.messageId,
          senderId: data.senderId
        });
      }
    } catch (error) {
      console.error('Errore nella gestione del messaggio ricevuto:', error);
    }
  };
  
  const handleMessageRead = (data) => {
    setConversations(prev => {
      const conversation = prev[data.readerId] || [];
      return {
        ...prev,
        [data.readerId]: conversation.map(msg => 
          msg._id === data.messageId ? { ...msg, read: true } : msg
        )
      };
    });
  };
  
  const handleTypingStart = (data) => {
    setTypingUsers(prev => ({
      ...prev,
      [data.senderId]: true
    }));
  };
  
  const handleTypingStop = (data) => {
    setTypingUsers(prev => {
      const newState = { ...prev };
      delete newState[data.senderId];
      return newState;
    });
  };
  
  const handleUserOnline = (userId) => {
    setOnlineUsers(prev => ({
      ...prev,
      [userId]: true
    }));
  };
  
  const handleUserOffline = (userId) => {
    setOnlineUsers(prev => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
  };
  
  // Carica i contatti
  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/contacts`);
      
      setContacts(response.data);
    } catch (err) {
      console.error('Errore nel caricamento dei contatti:', err);
      setError(err.response?.data?.message || 'Errore nel caricamento dei contatti');
    } finally {
      setLoading(false);
    }
  };
  
  // Carica i messaggi di una conversazione
  const loadConversation = async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/messages/${contactId}`);
      
      // Decripta i messaggi
      const decryptedMessages = await Promise.all(
        response.data.map(async (msg) => {
          try {
            const decryptedContent = await cryptoService.decryptMessage(
              msg.sender === user._id ? msg.recipient : msg.sender,
              msg.encryptedContent
            );
            
            return {
              ...msg,
              content: decryptedContent
            };
          } catch (error) {
            console.error('Errore nella decrittazione del messaggio:', error);
            return {
              ...msg,
              content: 'Errore nella decrittazione del messaggio'
            };
          }
        })
      );
      
      setConversations(prev => ({
        ...prev,
        [contactId]: decryptedMessages
      }));
      
      setActiveConversation(contactId);
      
      // Segna i messaggi come letti
      markMessagesAsRead(contactId, decryptedMessages);
    } catch (err) {
      console.error('Errore nel caricamento della conversazione:', err);
      setError(err.response?.data?.message || 'Errore nel caricamento della conversazione');
    } finally {
      setLoading(false);
    }
  };
  
  // Segna i messaggi come letti
  const markMessagesAsRead = async (contactId, messages) => {
    try {
      const unreadMessages = messages.filter(
        msg => !msg.read && msg.sender === contactId
      );
      
      for (const msg of unreadMessages) {
        await axios.put(`${API_URL}/messages/${msg._id}/read`);
        
        if (socket) {
          socket.emit('message:read', {
            messageId: msg._id,
            senderId: msg.sender
          });
        }
      }
    } catch (error) {
      console.error('Errore nel segnare i messaggi come letti:', error);
    }
  };
  
  // Invia un messaggio
  const sendMessage = async (recipientId, content, attachments = []) => {
    try {
      setLoading(true);
      setError(null);
      
      // Cripta il messaggio
      const encryptedContent = await cryptoService.encryptMessage(
        recipientId,
        content
      );
      
      // Prepara i dati del messaggio
      const formData = new FormData();
      formData.append('recipientId', recipientId);
      formData.append('content', content);
      formData.append('encryptedContent', encryptedContent);
      
      // Aggiungi gli allegati
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      // Invia il messaggio al backend
      const response = await axios.post(`${API_URL}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Aggiorna la conversazione
      setConversations(prev => {
        const conversation = prev[recipientId] || [];
        return {
          ...prev,
          [recipientId]: [
            ...conversation,
            {
              ...response.data,
              content
            }
          ]
        };
      });
      
      // Invia il messaggio tramite socket
      if (socket) {
        socket.emit('message:send', {
          messageId: response.data._id,
          recipientId,
          content,
          encryptedContent,
          timestamp: response.data.timestamp,
          attachments: response.data.attachments
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('Errore nell\'invio del messaggio:', err);
      setError(err.response?.data?.message || 'Errore nell\'invio del messaggio');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Notifica che l'utente sta digitando
  const sendTypingNotification = (recipientId, isTyping) => {
    if (socket) {
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', { recipientId });
    }
  };
  
  // Aggiungi un contatto
  const addContact = async (contactId, nickname) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/contacts`, {
        contactId,
        nickname
      });
      
      setContacts(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err) {
      console.error('Errore nell\'aggiunta del contatto:', err);
      setError(err.response?.data?.message || 'Errore nell\'aggiunta del contatto');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Blocca un contatto
  const blockContact = async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`${API_URL}/contacts/${contactId}/block`);
      
      setContacts(prev => 
        prev.map(contact => 
          contact._id === contactId ? response.data : contact
        )
      );
      
      return response.data;
    } catch (err) {
      console.error('Errore nel blocco del contatto:', err);
      setError(err.response?.data?.message || 'Errore nel blocco del contatto');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Sblocca un contatto
  const unblockContact = async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`${API_URL}/contacts/${contactId}/unblock`);
      
      setContacts(prev => 
        prev.map(contact => 
          contact._id === contactId ? response.data : contact
        )
      );
      
      return response.data;
    } catch (err) {
      console.error('Errore nello sblocco del contatto:', err);
      setError(err.response?.data?.message || 'Errore nello sblocco del contatto');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Elimina un contatto
  const deleteContact = async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${API_URL}/contacts/${contactId}`);
      
      setContacts(prev => prev.filter(contact => contact._id !== contactId));
      
      return true;
    } catch (err) {
      console.error('Errore nell\'eliminazione del contatto:', err);
      setError(err.response?.data?.message || 'Errore nell\'eliminazione del contatto');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Cerca utenti
  const searchUsers = async (query) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/users/search?query=${query}`);
      
      return response.data;
    } catch (err) {
      console.error('Errore nella ricerca degli utenti:', err);
      setError(err.response?.data?.message || 'Errore nella ricerca degli utenti');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ChatContext.Provider
      value={{
        contacts,
        conversations,
        activeConversation,
        loading,
        error,
        onlineUsers,
        typingUsers,
        setActiveConversation,
        loadConversation,
        sendMessage,
        sendTypingNotification,
        addContact,
        blockContact,
        unblockContact,
        deleteContact,
        searchUsers,
        isOnline: (userId) => !!onlineUsers[userId],
        isTyping: (userId) => !!typingUsers[userId]
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
