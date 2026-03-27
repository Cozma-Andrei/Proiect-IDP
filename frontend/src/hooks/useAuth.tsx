import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface AuthState {
  token: string | null;
  role: string | null;
  activeProfile: string | null;
  hasDoctorProfile: boolean;
  hasPatientProfile: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkProfiles: () => Promise<{ hasDoc: boolean; hasPat: boolean }>;
  chooseProfile: (profile: 'Doctor' | 'Patient' | 'Admin') => void;
}

const AuthContext = createContext<AuthState & { loading: boolean } | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [hasDoctorProfile, setHasDoctorProfile] = useState<boolean>(false);
  const [hasPatientProfile, setHasPatientProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const checkProfiles = async () => {
    let docExists = false;
    let patExists = false;
    try {
      await api.get('/doctor/profile');
      docExists = true;
    } catch {}
    try {
      await api.get('/patient/profile');
      patExists = true;
    } catch {}
    setHasDoctorProfile(docExists);
    setHasPatientProfile(patExists);
    return { hasDoc: docExists, hasPat: patExists };
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedProfile = localStorage.getItem('activeProfile');
    if (storedProfile) {
      setActiveProfile(storedProfile);
    }

    if (storedToken) {
      setToken(storedToken);
      let extractedRole = null;
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        extractedRole = payload._doc?.role || payload.role;
        setRole(extractedRole);
      } catch (e) {
        console.error("Failed to decode token", e);
      }
      checkProfiles().then(({ hasDoc, hasPat }) => {
        const hasAdmin = extractedRole === 'Admin';
        let profileCount = 0;
        if (hasDoc) profileCount++;
        if (hasPat) profileCount++;
        if (hasAdmin) profileCount++;

        if (profileCount > 1 && !storedProfile) {
          navigate('/choose-profile', { replace: true });
        }
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      const userRole: string = payload._doc?.role || payload.role;
      localStorage.setItem('role', userRole);
      setRole(userRole);
      
      checkProfiles().then(({ hasDoc, hasPat }) => {
        const hasAdmin = userRole === 'Admin';
        let profileCount = 0;
        if (hasDoc) profileCount++;
        if (hasPat) profileCount++;
        if (hasAdmin) profileCount++;

        if (profileCount > 1) {
          localStorage.removeItem('activeProfile');
          setActiveProfile(null);
          navigate('/choose-profile', { replace: true });
        } else {
          const autoProfile = hasAdmin ? 'Admin' : (hasDoc ? 'Doctor' : (hasPat ? 'Patient' : userRole));
          localStorage.setItem('activeProfile', autoProfile);
          setActiveProfile(autoProfile);
          navigate('/', { replace: true });
        }
      });
    } catch {
      setRole(null);
      navigate('/', { replace: true });
    }
  };

  const chooseProfile = (profile: 'Doctor' | 'Patient' | 'Admin') => {
    localStorage.setItem('activeProfile', profile);
    setActiveProfile(profile);
    navigate('/', { replace: true });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('activeProfile');
    setToken(null);
    setRole(null);
    setActiveProfile(null);
    setHasDoctorProfile(false);
    setHasPatientProfile(false);
    navigate('/login', { replace: true });
  };

  const value = { token, role, activeProfile, hasDoctorProfile, hasPatientProfile, login, logout, checkProfiles, chooseProfile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
