import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
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
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);

      // Clean up previous profile listener if it exists
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time profile updates
        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Profile;
            // Auto-upgrade vickthorden@gmail.com to admin if they are not already
            if (firebaseUser.email === "vickthorden@gmail.com" && data.role !== 'admin') {
              updateDoc(userDocRef, { 
                role: 'admin',
                plan: 'business'
              }).catch(error => handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`));
            }
            setProfile(data);
          } else {
            // Create initial profile if it doesn't exist
            const baseUsername = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Check for uniqueness and create profile
            const checkAndCreateProfile = async () => {
              let uniqueUsername = baseUsername;
              let isUnique = false;
              let attempts = 0;

              while (!isUnique && attempts < 5) {
                const q = query(collection(db, 'users_public'), where('username', '==', uniqueUsername));
                try {
                  const querySnapshot = await getDocs(q);
                  if (querySnapshot.empty) {
                    isUnique = true;
                  } else {
                    uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
                    attempts++;
                  }
                } catch (error) {
                  handleFirestoreError(error, OperationType.GET, 'users');
                }
              }

              const initialProfile: Profile = {
                id: firebaseUser.uid,
                user_id: firebaseUser.uid,
                username: uniqueUsername,
                display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                bio: `Welcome to my profile!`,
                avatar_url: `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}&background=random`,
                theme: 'default',
                font_family: 'sans',
                bg_image_url: '',
                plan: firebaseUser.email === "vickthorden@gmail.com" ? "business" : "free",
                role: firebaseUser.email === "vickthorden@gmail.com" ? "admin" : "user",
                created_at: serverTimestamp() as any,
              };

              const publicProfile = {
                username: uniqueUsername,
                display_name: initialProfile.display_name,
                bio: initialProfile.bio,
                avatar_url: initialProfile.avatar_url,
                theme: initialProfile.theme,
                font_family: initialProfile.font_family,
                is_verified: false,
                is_featured: false
              };

              try {
                await Promise.all([
                  setDoc(userDocRef, initialProfile),
                  setDoc(doc(db, 'users_public', firebaseUser.uid), publicProfile)
                ]);
                setProfile(initialProfile);
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
              }
            };

            checkAndCreateProfile();
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
