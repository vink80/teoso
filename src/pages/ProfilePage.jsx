import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext.jsx';
import './ProfilePage.css';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateProfile, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || ''
  });
  
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      
      // In una implementazione reale, qui si caricherebbe l'immagine su un server
      // e si otterrebbe l'URL dell'immagine caricata
      
      // Simuliamo il caricamento con un timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Creiamo un URL locale per l'anteprima
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Errore nel caricamento dell\'immagine:', error);
      setUploadingImage(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateProfile(formData);
      setSuccess(true);
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Errore nell\'aggiornamento del profilo:', error);
    }
  };
  
  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>{t('profile.title')}</h1>
        
        <div className="profile-picture-section">
          <div className="profile-picture">
            {formData.profilePicture ? (
              <img src={formData.profilePicture} alt={t('profile.profilePicture')} />
            ) : (
              <div className="profile-picture-placeholder">
                {formData.displayName ? formData.displayName[0].toUpperCase() : '?'}
              </div>
            )}
          </div>
          
          <div className="profile-picture-upload">
            <label htmlFor="profile-picture-input" className="upload-button">
              {uploadingImage ? t('profile.uploading') : t('profile.changePicture')}
            </label>
            <input
              id="profile-picture-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">{t('profile.username')}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('profile.usernamePlaceholder')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="displayName">{t('profile.displayName')}</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder={t('profile.displayNamePlaceholder')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">{t('profile.bio')}</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder={t('profile.bioPlaceholder')}
              rows={4}
            />
          </div>
          
          <div className="wallet-address">
            <label>{t('profile.walletAddress')}</label>
            <div className="wallet-address-value">{user?.walletAddress}</div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              {t('profile.updateSuccess')}
            </div>
          )}
          
          <button type="submit" className="save-button" disabled={loading}>
            {loading ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
