// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, githubProvider } from '../../firebaseConfig'; // Ajusta la ruta si es necesario
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';


const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithGitHub = async () => {
    try {
      // Intenta primero con popup
      return await signInWithPopup(auth, githubProvider);
    } catch (err) {
      // Si el error es de popup bloqueado o similar, haz fallback a redirect
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        return await signInWithRedirect(auth, githubProvider);
      } else {
        throw err;
      }
    }
  };

  const logout = () => {
    return firebaseSignOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        user.getIdToken().then(token => {
          console.log('[AuthContext] UID:', user.uid, '| Token:', token);
        });
      } else {
        console.log('[AuthContext] No user logged in');
      }
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    loading,
    signInWithGitHub,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
