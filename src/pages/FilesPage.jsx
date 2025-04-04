import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';
import cryptoService from '../utils/cryptoService';
import './FilesPage.css';

const FilesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUserId, setShareUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Carica i file dell'utente
  useEffect(() => {
    loadFiles();
  }, []);
  
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/files`);
      
      setFiles(response.data);
    } catch (err) {
      console.error('Errore nel caricamento dei file:', err);
      setError(t('files.loadError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce il caricamento di un file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      setError(null);
      
      // Crea una chiave per la crittografia del file
      const fileKey = cryptoService.generateFileKey();
      
      // In una implementazione reale, qui si cripterebbe il file prima di caricarlo
      // Per semplicità, carichiamo il file direttamente
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFiles(prev => [response.data, ...prev]);
      
      setSuccess(t('files.uploadSuccess'));
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Errore nel caricamento del file:', err);
      setError(t('files.uploadError'));
    } finally {
      setUploading(false);
    }
  };
  
  // Gestisce l'eliminazione di un file
  const handleDeleteFile = async (fileId) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${API_URL}/files/${fileId}`);
      
      setFiles(prev => prev.filter(file => file._id !== fileId));
      
      setSuccess(t('files.deleteSuccess'));
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Errore nell\'eliminazione del file:', err);
      setError(t('files.deleteError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce la condivisione di un file
  const handleShareFile = async () => {
    if (!selectedFile || !shareUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API_URL}/files/${selectedFile._id}/share`, {
        userId: shareUserId,
        accessType: 'read'
      });
      
      // Aggiorna la lista dei file
      loadFiles();
      
      setSuccess(t('files.shareSuccess'));
      
      // Chiudi il modal
      setShareModalOpen(false);
      setSelectedFile(null);
      setShareUserId('');
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Errore nella condivisione del file:', err);
      setError(t('files.shareError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce la ricerca di utenti
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/users/search?query=${searchQuery}`);
      
      setSearchResults(response.data);
    } catch (err) {
      console.error('Errore nella ricerca degli utenti:', err);
      setError(t('files.searchError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Formatta la dimensione del file
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };
  
  return (
    <div className="files-page">
      <div className="files-container">
        <h1>{t('files.title')}</h1>
        
        <div className="upload-section">
          <label htmlFor="file-upload" className="upload-button">
            {uploading ? t('files.uploading') : t('files.uploadFile')}
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          
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
        </div>
        
        <div className="files-list">
          {loading && files.length === 0 ? (
            <div className="loading-indicator">
              {t('files.loading')}
            </div>
          ) : files.length === 0 ? (
            <div className="no-files">
              {t('files.noFiles')}
            </div>
          ) : (
            files.map(file => (
              <div key={file._id} className="file-item">
                <div className="file-icon">
                  {file.fileType.startsWith('image/') ? (
                    <span className="material-icons">image</span>
                  ) : file.fileType.startsWith('video/') ? (
                    <span className="material-icons">videocam</span>
                  ) : file.fileType.startsWith('audio/') ? (
                    <span className="material-icons">audiotrack</span>
                  ) : file.fileType.includes('pdf') ? (
                    <span className="material-icons">picture_as_pdf</span>
                  ) : file.fileType.includes('word') ? (
                    <span className="material-icons">description</span>
                  ) : file.fileType.includes('excel') || file.fileType.includes('sheet') ? (
                    <span className="material-icons">table_chart</span>
                  ) : (
                    <span className="material-icons">insert_drive_file</span>
                  )}
                </div>
                <div className="file-info">
                  <div className="file-name">{file.originalName}</div>
                  <div className="file-details">
                    <span className="file-size">{formatFileSize(file.fileSize)}</span>
                    <span className="file-date">
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="file-actions">
                  <button 
                    className="download-button"
                    onClick={() => window.open(`${API_URL}/files/${file._id}/download`)}
                  >
                    <span className="material-icons">download</span>
                  </button>
                  <button 
                    className="share-button"
                    onClick={() => {
                      setSelectedFile(file);
                      setShareModalOpen(true);
                    }}
                  >
                    <span className="material-icons">share</span>
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteFile(file._id)}
                  >
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {shareModalOpen && (
        <div className="share-modal">
          <div className="modal-content">
            <h2>{t('files.shareFile')}</h2>
            <p>{t('files.shareWith', { fileName: selectedFile?.originalName })}</p>
            
            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('files.searchPlaceholder')}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
              />
              <button 
                className="search-button"
                onClick={handleSearchUsers}
                disabled={loading}
              >
                {t('files.search')}
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(user => (
                  <div 
                    key={user._id} 
                    className={`result-item ${shareUserId === user._id ? 'selected' : ''}`}
                    onClick={() => setShareUserId(user._id)}
                  >
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
                ))}
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShareModalOpen(false);
                  setSelectedFile(null);
                  setShareUserId('');
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                {t('files.cancel')}
              </button>
              <button 
                className="share-button"
                onClick={handleShareFile}
                disabled={!shareUserId || loading}
              >
                {t('files.share')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;
