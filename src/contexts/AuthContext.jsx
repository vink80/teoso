import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useWalletConnection } from './WalletConnectionContext.jsx';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { connected, walletAddress, signMessage } = useWalletConnection();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Configura axios con il token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Autentica l'utente quando il wallet è connesso
  useEffect(() => {
    const authenticateUser = async () => {
      if (connected && walletAddress) {
        try {
          setLoading(true);
          setError(null);
          
          // Crea un messaggio di autenticazione con timestamp per evitare replay attack
          const timestamp = Date.now();
          const message = `Accedi a TellOnSol con il wallet: ${walletAddress} al timestamp: ${timestamp}`;
          
          // Firma il messaggio con il wallet
          const { signature } = await signMessage(message);
          
          // Invia la richiesta di autenticazione al backend
          const response = await axios.post(`${API_URL}/users/auth`, {
            walletAddress,
            signature,
            message
          });
          
          // Salva il token e i dati utente
          const { token: newToken, ...userData } = response.data;
          localStorage.setItem('token', newToken);
          setToken(newToken);
          setUser(userData);
        } catch (err) {
          console.error('Errore di autenticazione:', err);
          setError(err.response?.data?.message || 'Errore di autenticazione');
        } finally {
          setLoading(false);
        }
      }
    };
    
    authenticateUser();
  }, [connected, walletAddress, signMessage]);

  // Logout
  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_URL}/users/logout`);
      }
    } catch (err) {
      console.error('Errore durante il logout:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  // Aggiorna il profilo utente
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`${API_URL}/users/profile`, profileData);
      
      setUser(prevUser => ({
        ...prevUser,
        ...response.data
      }));
      
      return response.data;
    } catch (err) {
      console.error('Errore nell\'aggiornamento del profilo:', err);
      setError(err.response?.data?.message || 'Errore nell\'aggiornamento del profilo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Ottieni le sessioni attive
  const getSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/users/sessions`);
      
      return response.data;
    } catch (err) {
      console.error('Errore nel recupero delle sessioni:', err);
      setError(err.response?.data?.message || 'Errore nel recupero delle sessioni');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Termina una sessione specifica
  const terminateSession = async (sessionToken) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${API_URL}/users/sessions/${sessionToken}`);
      
      return true;
    } catch (err) {
      console.error('Errore nella terminazione della sessione:', err);
      setError(err.response?.data?.message || 'Errore nella terminazione della sessione');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        logout,
        updateProfile,
        getSessions,
        terminateSession,
        isAuthenticated: !!user && !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
