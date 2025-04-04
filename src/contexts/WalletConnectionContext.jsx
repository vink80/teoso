import React, { createContext, useState, useEffect, useContext } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletConnectionContext = createContext();

export const useWalletConnection = () => useContext(WalletConnectionContext);

export const WalletConnectionProvider = ({ children }) => {
  // Puoi scegliere la rete Solana (mainnet, testnet, devnet)
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = clusterApiUrl(network);

  // Inizializza tutti i wallet supportati
  const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
  ],
  []
);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const wallet = useWallet();

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      setConnected(true);
      setWalletAddress(wallet.publicKey.toString());
    } else {
      setConnected(false);
      setWalletAddress('');
    }
  }, [wallet.connected, wallet.publicKey]);

  // Funzione per firmare un messaggio con il wallet
  const signMessage = async (message) => {
    try {
      if (!wallet.connected) {
        throw new Error('Wallet non connesso');
      }

      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);
      
      return {
        signature: Buffer.from(signature).toString('base64'),
        message
      };
    } catch (error) {
      console.error('Errore nella firma del messaggio:', error);
      throw error;
    }
  };

  // Funzione per disconnettere il wallet
  const disconnect = async () => {
    try {
      if (wallet.connected) {
        await wallet.disconnect();
      }
    } catch (error) {
      console.error('Errore nella disconnessione del wallet:', error);
    }
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletConnectionContext.Provider
            value={{
              connected,
              walletAddress,
              signMessage,
              disconnect,
              wallet
            }}
          >
            {children}
          </WalletConnectionContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
