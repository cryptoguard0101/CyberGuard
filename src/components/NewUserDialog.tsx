import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { X, UserPlus } from 'lucide-react';
import { calculateStrength } from '../utils/passwordUtils';
import PasswordStrengthMeter from './PasswordStrengthMeter';

interface NewUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (userData: Omit<User, 'id' | 'lastLogin' | 'isLocked' | 'mfaSecret' | 'passkeyCredential'> & { password?: string }) => Promise<{success: boolean, error?: string}>;
}

const NewUserDialog: React.FC<NewUserDialogProps> = ({ isOpen, onClose, onCreateUser }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    if (calculateStrength(password) < 3) {
      setError('Das initiale Passwort ist zu schwach.');
      return;
    }

    const result = await onCreateUser({ email, username, password, role, encryptionKey: "", validUntil: null });
    if (result.success) {
      // Reset form and close
      setEmail('');
      setUsername('');
      setPassword('');
      setPasswordConfirm('');
      setRole('EMPLOYEE');
      onClose();
    } else {
      setError(result.error || 'Ein unbekannter Fehler ist aufgetreten.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center animate-in fade-in-25">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg m-4 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                <UserPlus size={28} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900">Neuen Benutzer anlegen</h2>
                <p className="text-slate-500 text-sm">Das Konto wird sofort erstellt und ist aktiv.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    {error}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail-Adresse</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-300" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Anzeigename <span className="text-slate-400">(Optional)</span></label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rolle</label>
                <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="EMPLOYEE">Mitarbeiter (EMPLOYEE)</option>
                    <option value="ADMIN">Administrator (ADMIN)</option>
                    <option value="IT_PROVIDER">IT-Dienstleister (IT_PROVIDER)</option>
                    <option value="VIEWER">Betrachter (VIEWER)</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initiales Passwort</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-300" />
            </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passwort bestätigen</label>
                <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-300" />
            </div>

            {password.length > 0 && <PasswordStrengthMeter password={password} />}

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50">
                    Abbrechen
                </button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 flex items-center gap-2">
                    <UserPlus size={16} />
                    Benutzer erstellen
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewUserDialog;
