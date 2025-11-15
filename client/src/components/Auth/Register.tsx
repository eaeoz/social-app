import { useState, useEffect } from 'react';
import './Auth.css';
import PrivacyPolicy from '../Legal/PrivacyPolicy';
import TermsConditions from '../Legal/TermsConditions';
import About from '../Legal/About';
import Contact from '../Legal/Contact';
import Blog from '../Legal/Blog';
import ImageCropper from './ImageCropper';
import NSFWWarningModal from './NSFWWarningModal';
import { nsfwDetector } from '../../utils/nsfwDetector';

interface RegisterProps {
  onRegisterSuccess: (user: any, token: string) => void;
  onSwitchToLogin: () => void;
}

// Declare grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: any;
  }
}

function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const [showNSFWWarning, setShowNSFWWarning] = useState(false);
  const [nsfwWarnings, setNsfwWarnings] = useState<string[]>([]);
  const [pendingCroppedBlob, setPendingCroppedBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [allowUserPictures, setAllowUserPictures] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  // Fetch site settings to get allowUserPictures value
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/site`);
        if (response.ok) {
          const data = await response.json();
          setAllowUserPictures(data.settings.allowUserPictures !== false);
        }
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
        // Default to true if fetch fails
        setAllowUserPictures(true);
      }
    };

    fetchSiteSettings();
  }, [API_URL]);

  // Load reCAPTCHA script
  useEffect(() => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error('reCAPTCHA site key not found');
      return;
    }

    // Check if script already exists
    if (document.querySelector(`script[src*="recaptcha"]`)) {
      setRecaptchaLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setRecaptchaLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('authTheme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Set dark theme as default for first visit
      setTheme('dark');
      localStorage.setItem('authTheme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('authTheme', newTheme);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setError('');

      // Create preview and show cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string);
        setShowImageCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowImageCropper(false);
    setTempImageUrl('');
    setIsAnalyzing(true);
    setError('');

    try {
      // Analyze the image for NSFW content
      const result = await nsfwDetector.analyzeImage(croppedBlob);
      
      if (result.isNSFW) {
        // Show warning modal
        setPendingCroppedBlob(croppedBlob);
        setNsfwWarnings(result.warnings);
        setShowNSFWWarning(true);
      } else {
        // Safe image - proceed with upload
        proceedWithImageUpload(croppedBlob);
      }
    } catch (err: any) {
      console.error('NSFW detection error:', err);
      // If detection fails, allow upload but log the error
      setError('Content detection unavailable. Proceeding with upload.');
      proceedWithImageUpload(croppedBlob);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const proceedWithImageUpload = (croppedBlob: Blob) => {
    // Convert blob to File
    const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
    setProfilePicture(file);
    
    // Create preview from blob
    const url = URL.createObjectURL(croppedBlob);
    setPreviewUrl(url);
  };

  const handleNSFWContinue = () => {
    if (pendingCroppedBlob) {
      proceedWithImageUpload(pendingCroppedBlob);
    }
    setShowNSFWWarning(false);
    setPendingCroppedBlob(null);
    setNsfwWarnings([]);
  };

  const handleNSFWCancel = () => {
    setShowNSFWWarning(false);
    setPendingCroppedBlob(null);
    setNsfwWarnings([]);
    // Allow user to select a different image
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    setTempImageUrl('');
  };

  const removeImage = () => {
    setProfilePicture(null);
    setPreviewUrl('');
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate age
    if (!age) {
      setError('Please select your age');
      return;
    }

    // Validate gender
    if (!gender) {
      setError('Please select your gender');
      return;
    }

    setLoading(true);

    try {
      // Get reCAPTCHA token
      let recaptchaToken = '';
      if (recaptchaLoaded && window.grecaptcha) {
        const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
        try {
          recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'register' });
        } catch (error) {
          console.error('reCAPTCHA execution failed:', error);
          setError('Security verification failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('fullName', fullName);
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('recaptchaToken', recaptchaToken);
      
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: formData, // Don't set Content-Type, browser will set it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Check if email verification is required
      if (data.requiresEmailVerification) {
        setRegisteredEmail(email);
        setShowVerificationModal(true);
        // Clear the form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setAge('');
        setGender('');
        setProfilePicture(null);
        setPreviewUrl('');
      } else {
        // Old flow: direct login (for backward compatibility)
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        onRegisterSuccess(data.user, data.accessToken);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" data-theme={theme}>
      {/* Email Verification Modal */}
      {showVerificationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">📧</div>
            <h2>Check Your Email!</h2>
            <p className="modal-message">
              We've sent a verification email to <strong>{registeredEmail}</strong>
            </p>
            <p className="modal-submessage">
              Click the verification link in the email to activate your account. 
              The link will expire in 24 hours.
            </p>
            <div className="modal-actions">
              <button 
                className="auth-button" 
                onClick={onSwitchToLogin}
              >
                Go to Login
              </button>
            </div>
            {error && <div className="error-message" style={{ marginTop: '15px' }}>{error}</div>}
          </div>
        </div>
      )}

      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="auth-logo-text">💬 {import.meta.env.VITE_APP_NAME || 'Netcify'}</h1>
          <button className="auth-theme-toggle-card" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            <div className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}>
              <div className="toggle-slider">
                <span className="toggle-icon">{theme === 'light' ? '☀️' : '🌙'}</span>
              </div>
            </div>
          </button>
        </div>
        <div className="auth-header-with-logo">
          <img 
            src="/logo_sedatchat.gif" 
            alt="Netcify Logo" 
            className="auth-logo-image"
          />
          <div className="auth-header-text">
            <h1>🎉 Create Account</h1>
            <p className="subtitle">Join the chat community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          {/* Profile Picture Upload - Only show if allowed */}
          {allowUserPictures && (
            <div className="form-group">
              <div className="profile-picture-upload">
                {previewUrl ? (
                  <div className="profile-preview-container">
                    <img src={previewUrl} alt="Profile preview" className="profile-preview" />
                    <button type="button" onClick={removeImage} className="remove-image-btn" disabled={loading}>
                      ×
                    </button>
                  </div>
                ) : (
                  <label htmlFor="profilePicture" className="upload-label">
                    <div className="upload-placeholder">
                      <span className="upload-icon">📷</span>
                      <span className="upload-text">Click to upload photo</span>
                    </div>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={loading}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <select
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Age</option>
              {Array.from({ length: 83 }, (_, i) => i + 18).map((ageValue) => (
                <option key={ageValue} value={ageValue}>
                  {ageValue}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={gender === 'Male'}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={loading}
                  required
                />
                <span>Male</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={gender === 'Female'}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={loading}
                  required
                />
                <span>Female</span>
              </label>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading || !recaptchaLoaded}>
            {loading ? 'Creating Account...' : !recaptchaLoaded ? 'Loading...' : 'Sign Up'}
          </button>

          <div className="recaptcha-notice">
            <small>
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" aria-label="Read Google's Privacy Policy">Privacy Policy</a> and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" aria-label="Read Google's Terms of Service">Terms of Service</a> apply.
            </small>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="link-button">
              Sign In
            </button>
          </p>
        </div>

        <div className="auth-footer-links">
          <button onClick={() => setShowPrivacyPolicy(true)} className="footer-link-button">
            Privacy Policy
          </button>
          <span className="footer-separator">•</span>
          <button onClick={() => setShowTerms(true)} className="footer-link-button">
            Terms
          </button>
          <span className="footer-separator">•</span>
          <button onClick={() => setShowBlog(true)} className="footer-link-button">
            Blog
          </button>
          <span className="footer-separator">•</span>
          <button onClick={() => setShowAbout(true)} className="footer-link-button">
            About
          </button>
          <span className="footer-separator">•</span>
          <button onClick={() => setShowContact(true)} className="footer-link-button">
            Contact
          </button>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.6',
          color: theme === 'dark' ? '#94a3b8' : '#64748b'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px',
            fontWeight: '600',
            color: theme === 'dark' ? '#cbd5e1' : '#475569'
          }}>
            <span>🛡️</span>
            <span>Safety & Protection Features</span>
          </div>
          <ul style={{ 
            margin: '0', 
            paddingLeft: '25px',
            listStyleType: 'none'
          }}>
            <li style={{ marginBottom: '4px' }}>✓ AI-powered +18 image protection with automatic detection</li>
            <li style={{ marginBottom: '4px' }}>✓ Real-time chat filtering for inappropriate words and content</li>
            <li style={{ marginBottom: '4px' }}>✓ Automatic user suspension after 10 reports from different users</li>
            <li style={{ marginBottom: '4px' }}>✓ Advanced spam and repetitive message monitoring system</li>
            <li style={{ marginBottom: '4px' }}>✓ Suspended users kept without email confirmation for security</li>
            <li style={{ marginBottom: '4px' }}>✓ System logs backed up and maintained for a specific period</li>
          </ul>
        </div>
      </div>

      {showPrivacyPolicy && <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />}
      {showTerms && <TermsConditions onClose={() => setShowTerms(false)} />}
      {showBlog && <Blog onClose={() => setShowBlog(false)} />}
      {showAbout && <About onClose={() => setShowAbout(false)} />}
      {showContact && <Contact onClose={() => setShowContact(false)} />}
      
      {showImageCropper && tempImageUrl && (
        <ImageCropper
          imageSrc={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {showNSFWWarning && nsfwWarnings.length > 0 && (
        <NSFWWarningModal
          warnings={nsfwWarnings}
          onContinue={handleNSFWContinue}
          onCancel={handleNSFWCancel}
        />
      )}

      {isAnalyzing && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div className="modal-icon">🔍</div>
            <h2>Analyzing Image...</h2>
            <p className="modal-message">
              Checking image content for community guidelines compliance.
            </p>
            <div style={{ margin: '20px 0' }}>
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
