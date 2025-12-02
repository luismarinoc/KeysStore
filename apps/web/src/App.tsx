import { useState, useEffect } from 'react'
import { getDataStore, getSupabase } from '@keysstore/sdk-client'
import type { Organization } from '@keysstore/shared-types'
import { OrganizationSelector } from './components/OrganizationSelector'
import './App.css'

function App() {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    loadSession();
  }, []);

  const handleSignIn = async () => {
    const supabase = getSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setCurrentOrg(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM17.5 8.5C17.5 9.33 16.83 10 16 10C15.17 10 14.5 9.33 14.5 8.5C14.5 7.67 15.17 7 16 7C16.83 7 17.5 7.67 17.5 8.5ZM6.5 8.5C6.5 9.33 5.83 10 5 10C4.17 10 3.5 9.33 3.5 8.5C3.5 7.67 4.17 7 5 7C5.83 7 6.5 7.67 6.5 8.5ZM19 16C20.1 16 21 16.9 21 18C21 19.1 20.1 20 19 20C17.9 20 17 19.1 17 18C17 16.9 17.9 16 19 16ZM5 16C6.1 16 7 16.9 7 18C7 19.1 6.1 20 5 20C3.9 20 3 19.1 3 18C3 16.9 3.9 16 5 16Z" fill="url(#gradient)" />
                <defs>
                  <linearGradient id="gradient" x1="3" y1="2" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="logo-title">KeysStore</h1>
            <p className="logo-subtitle">Secure Credential Management</p>
          </div>

          <div className="divider"></div>

          <button onClick={handleSignIn} className="google-sign-in-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
              <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.71 16.7 5.84 14.09H2.18V16.95C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
              <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.05H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.95L5.84 14.09Z" fill="#FBBC05" />
              <path d="M12 5.38C13.62 5.38 15.06 5.91 16.21 7.01L19.36 3.86C17.45 2.09 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.05L5.84 9.91C6.71 7.3 9.13 5.38 12 5.38Z" fill="#EA4335" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="security-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" fill="currentColor" />
            </svg>
            <span>Your credentials are encrypted and stored securely</span>
          </div>

          <div className="features">
            <div className="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11.75C6.66 11.75 0.5 12.92 0.5 15.25V17.5H17.5V15.25C17.5 12.92 11.34 11.75 9 11.75ZM4.34 15.5C5.18 14.94 7.21 14.25 9 14.25C10.79 14.25 12.82 14.94 13.66 15.5H4.34ZM9 10C10.93 10 12.5 8.43 12.5 6.5C12.5 4.57 10.93 3 9 3C7.07 3 5.5 4.57 5.5 6.5C5.5 8.43 7.07 10 9 10ZM9 5C9.83 5 10.5 5.67 10.5 6.5C10.5 7.33 9.83 8 9 8C8.17 8 7.5 7.33 7.5 6.5C7.5 5.67 8.17 5 9 5ZM16.04 13.81C17.2 14.65 18 15.77 18 15.25V15.25C18 12.92 11.84 11.75 9.5 11.75C9.46 11.75 9.42 11.75 9.38 11.75C10.95 12.41 12.5 13.59 12.5 15.25V17.5H23.5V15.25C23.5 13.84 19.67 12.98 16.04 13.81Z" fill="#6366F1" />
              </svg>
              <span>Multi-tenant organizations</span>
            </div>
            <div className="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="#8B5CF6" />
              </svg>
              <span>Cross-platform sync</span>
            </div>
          </div>
        </div>

        <div className="background-gradient"></div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="app-container">
        <div className="header">
          <h1>KeysStore</h1>
          <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
        </div>
        <OrganizationSelector onSelect={setCurrentOrg} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <div>
          <h1>KeysStore</h1>
          <span className="org-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 2Z" fill="currentColor" />
            </svg>
            {currentOrg.name}
          </span>
        </div>
        <div className="header-actions">
          <button onClick={() => setCurrentOrg(null)} className="switch-org-btn">Switch Org</button>
          <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
        </div>
      </div>
      <div className="main-content">
        <div className="welcome-card">
          <h2>Welcome to KeysStore</h2>
          <p>Your secure credential management platform</p>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Projects</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Credentials</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1</span>
              <span className="stat-label">Organizations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
