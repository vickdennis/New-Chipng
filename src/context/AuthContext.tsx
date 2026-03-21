import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Profile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);

      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time profile updates
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Profile;
            // Auto-upgrade vickthorden@gmail.com to admin if they are not already
            if (firebaseUser.email === "vickthorden@gmail.com" && data.role !== 'admin') {
              updateDoc(userDocRef, { 
                role: 'admin',
                plan: 'business'
              });
            }
            setProfile(data);
          } else {
            // Create initial profile if it doesn't exist
            const initialProfile: Profile = {
              id: firebaseUser.uid,
              user_id: firebaseUser.uid,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
              display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              bio: `Welcome to my Chip NG profile!`,
              avatar_url: `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}&background=random`,
              theme: 'default',
              font_family: 'sans',
              bg_image_url: '',
              plan: firebaseUser.email === "vickthorden@gmail.com" ? "business" : "free",
              role: firebaseUser.email === "vickthorden@gmail.com" ? "admin" : "user",
            };
            setDoc(userDocRef, initialProfile);
            setProfile(initialProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching profile:", error);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
