import React from 'react';
import { 
  SignalProtocolStore,
  KeyHelper,
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress
} from '@signalapp/libsignal-client';
import crypto from 'crypto';

// Classe per gestire la crittografia end-to-end con protocollo Signal
class CryptoService {
  constructor() {
    this.store = new SignalProtocolStore();
    this.initialized = false;
    this.initPromise = null;
  }

  // Inizializza il servizio di crittografia
  async initialize() {
    if (this.initialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = new Promise(async (resolve) => {
      try {
        // Carica le chiavi dal localStorage se esistono
        const identityKeyPair = localStorage.getItem('identityKeyPair');
        const registrationId = localStorage.getItem('registrationId');
        
        if (identityKeyPair && registrationId) {
          this.store.put('identityKey', JSON.parse(identityKeyPair));
          this.store.put('registrationId', parseInt(registrationId));
        } else {
          // Genera nuove chiavi
          const newIdentityKeyPair = await KeyHelper.generateIdentityKeyPair();
          const newRegistrationId = KeyHelper.generateRegistrationId();
          
          this.store.put('identityKey', newIdentityKeyPair);
          this.store.put('registrationId', newRegistrationId);
          
          localStorage.setItem('identityKeyPair', JSON.stringify(newIdentityKeyPair));
          localStorage.setItem('registrationId', newRegistrationId.toString());
        }
        
        this.initialized = true;
        resolve();
      } catch (error) {
        console.error('Errore nell\'inizializzazione del servizio di crittografia:', error);
        throw error;
      }
    });
    
    return this.initPromise;
  }

  // Genera le coppie di chiavi per l'utente
  async generateIdentityKeyPair() {
    await this.initialize();
    return await KeyHelper.generateIdentityKeyPair();
  }

  // Genera il numero di registrazione per l'utente
  async generateRegistrationId() {
    await this.initialize();
    return await KeyHelper.generateRegistrationId();
  }

  // Genera le chiavi prekey
  async generatePreKeys(startId, count) {
    await this.initialize();
    return await KeyHelper.generatePreKeys(startId, count);
  }

  // Genera la chiave prekey firmata
  async generateSignedPreKey(identityKeyPair, signedPreKeyId) {
    await this.initialize();
    return await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId);
  }

  // Inizializza una sessione con un altro utente
  async initializeSession(address, preKeyBundle) {
    await this.initialize();
    const sessionBuilder = new SessionBuilder(this.store, address);
    return await sessionBuilder.processPreKeyBundle(preKeyBundle);
  }

  // Cripta un messaggio per un destinatario
  async encryptMessage(recipientId, message) {
    await this.initialize();
    
    const address = new SignalProtocolAddress(recipientId, 1);
    const sessionCipher = new SessionCipher(this.store, address);
    
    const ciphertext = await sessionCipher.encrypt(Buffer.from(message, 'utf8'));
    return JSON.stringify(ciphertext);
  }

  // Decripta un messaggio ricevuto
  async decryptMessage(senderId, encryptedMessage) {
    await this.initialize();
    
    const address = new SignalProtocolAddress(senderId, 1);
    const sessionCipher = new SessionCipher(this.store, address);
    
    const ciphertext = JSON.parse(encryptedMessage);
    let plaintext;
    
    if (ciphertext.type === 3) { // PreKeyWhisperMessage
      plaintext = await sessionCipher.decrypt(ciphertext.body, 'binary');
    } else { // WhisperMessage
      plaintext = await sessionCipher.decrypt(ciphertext.body, 'binary');
    }
    
    return plaintext.toString('utf8');
  }

  // Cripta un file
  encryptFile(fileBuffer, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decripta un file
  decryptFile(encryptedData, iv, authTag, key) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedData, 'hex')),
      decipher.final()
    ]);
  }

  // Genera una chiave simmetrica per la crittografia dei file
  generateFileKey() {
    return crypto.randomBytes(32);
  }

  // Deriva una chiave da una password
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  }
}

export default new CryptoService();
