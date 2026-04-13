import { createContext, useContext, useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

const isCapacitor = typeof window !== 'undefined' && (window.location.protocol === 'capacitor:' || window.Capacitor?.isNativePlatform?.() === true);
const AuthContext = createContext();

async function saveToStorage(key, value) {
  if (isCapacitor) {
    await Preferences.set({ key, value });
  }
  localStorage.setItem(key, value);
}

async function getFromStorage(key) {
  if (isCapacitor) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

async function removeFromStorage(key) {
  if (isCapacitor) {
    await Preferences.remove({ key });
  }
  localStorage.removeItem(key);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const savedToken = await getFromStorage('cinestack_token');
        const savedUser = await getFromStorage('cinestack_user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('[Auth] Failed to load saved auth:', e);
      }
      setLoading(false);
    }
    loadAuth();
  }, []);

  const login = async (newToken, newUser) => {
    await saveToStorage('cinestack_token', newToken);
    await saveToStorage('cinestack_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await removeFromStorage('cinestack_token');
    await removeFromStorage('cinestack_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
