import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const userDoc = doc(db, 'users', fUser.uid);
        const privateDoc = doc(db, `users/${fUser.uid}/private`, 'info');
        
        const unsubUser = onSnapshot(userDoc, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUser(prev => ({ 
              uid: doc.id, 
              ...prev, 
              ...data,
              email: fUser.email // Always use firebase email as fallback
            } as User));
            
            // Try to get private data too
            getDoc(privateDoc).then(pDoc => {
              if (pDoc.exists()) {
                const pData = pDoc.data();
                setUser(prev => ({ ...prev, ...pData } as User));
              }
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('Auth user snapshot error:', error);
          setUser(null);
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
