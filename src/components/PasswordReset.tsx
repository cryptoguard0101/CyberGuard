import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import { calculateStrength } from '../utils/passwordUtils';
import PasswordStrengthMeter from './PasswordStrengthMeter';

interface PasswordResetProps {
  users: { email: string }[]; // We only need emails to check for existence
  onBackToLogin: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ users, onBackToLogin }) => {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      setError('');
      setStep('code');
    } else {
      setError('Kein Konto mit dieser E-Mail-Adresse gefunden.');
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: In a real app, verify the code on the server
    if (code === '123456') {
      setError('');
      // In a real app, you would now submit the new password to the server
      // For this demo, we'll just show a success message.
      setStep('success');
    } else {
      setError('Falscher Wiederherstellungscode.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800">Passwort zurücksetzen</h2>
        <p className="text-slate-500 text-sm mt-1">
          {step === 'email' && 'Geben Sie Ihre E-Mail-Adresse ein, um fortzufahren.'}
          {step === 'code' && `Ein Code wurde an ${email} gesendet.`}
          {step === 'success' && 'Ihr Passwort wurde erfolgreich zurückgesetzt.'}
        </p>
      </div>

      {error && (
        <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail-Adresse</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="ihre@email.de"
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            <Mail size={16} />
            Wiederherstellungs-Code senden
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
           <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
             <p className="text-sm text-yellow-800">Demo-Modus: Bitte verwenden Sie den Code <strong className="font-mono">123456</strong></p>
           </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">6-stelliger Wiederherstellungscode</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={6}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-center tracking-[0.5em] font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Passwort bestätigen</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          {newPassword.length > 0 && <PasswordStrengthMeter password={newPassword} />}
          </div>
          <button type="submit" disabled={code.length !== 6 || calculateStrength(newPassword) < 3 || newPassword !== passwordConfirm} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Lock size={16} />
            Neues Passwort festlegen
          </button>
        </form>
      )}

      {step === 'success' && (
        <button onClick={onBackToLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={16} />
          Zurück zum Login
          <ArrowRight size={16} />
        </button>
      )}

      {step !== 'success' && (
        <button onClick={onBackToLogin} className="w-full text-sm text-slate-400 hover:text-slate-600 mt-4">
          Zurück zum Login
        </button>
      )}
    </div>
  );
};

export default PasswordReset;
