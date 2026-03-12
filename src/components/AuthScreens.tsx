import React, { useState } from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';

interface AuthScreensProps {
  onLogin: (username: string, key: string, user?: User) => void;
  onLoginFail: (username: string) => void;
  onRegister: (userData: Partial<User>) => Promise<{success: boolean, error?: string, user?: User}>;
  users: User[];
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData: User;

      if (userDoc.exists()) {
        userData = userDoc.data() as User;
      } else {
        // Create new user profile
        userData = {
          id: user.uid,
          email: user.email || '',
          username: user.displayName || '',
          role: 'ADMIN', // First user or default role
          encryptionKey: 'firebase-auth',
          avatar: user.photoURL || undefined,
          lastLogin: new Date(),
        };
        await setDoc(doc(db, 'users', user.uid), userData);
      }

      onLogin(userData.email, 'firebase-auth', userData);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          CyberGuard
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sicherheitsmanagement für Ihr Unternehmen
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={20} />
                Mit Google anmelden
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
