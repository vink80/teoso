import { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl } from '@solana/web3.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { connected, publicKey, wallet } = useWallet();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      // Simuliamo il recupero dei dati utente dal tuo backend
      const fetchUserData = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${publicKey.toString()}`);
          const userData = await response.json();
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [connected, publicKey]);

  const value = {
    isAuthenticated: connected,
    user,
    loading,
    wallet
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
