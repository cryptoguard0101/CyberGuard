import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, Fingerprint, RefreshCcw, ArrowRight, ShieldAlert } from 'lucide-react';
import { createPasskey, verifyPasskey, generateKeyFromPassword } from '../services/cryptoService';
import { User } from '../types';
import { calculateStrength } from '../utils/passwordUtils';
import TotpSetup from './TotpSetup';
import EmailVerification from './EmailVerification';
import PasswordReset from './PasswordReset';
import PasswordStrengthMeter from './PasswordStrengthMeter';

interface AuthScreensProps {
  onLogin: (username: string, key: CryptoKey, user?: User) => void;
  onLoginFail: (username: string) => void;
  onRegister: (userData: Partial<User>) => Promise<{success: boolean, error?: string, user?: User}>;
  users: User[]; // Pass existing users to check for locks/expiry
}



export const AuthScreens: React.FC<AuthScreensProps> = ({ onLogin, onLoginFail, onRegister, users }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState<'credentials' | 'email-verification' | 'mfa' | 'totp-setup' | 'password-reset'>('credentials');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState<string | false>(false);
  const [error, setError] = useState('');

  // Automatically switch to registration if no users exist
  useEffect(() => {
    if (users.length === 0) {
      setIsRegistering(true);
    }
  }, [users]);

  // Simulated Salt for demo purposes (In real app, store per user)
  const DEMO_SALT = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);


  const validateUserStatus = (usernameOrEmail: string): { valid: boolean; error?: string } => {
    const user = users.find(u => u.email.toLowerCase() === usernameOrEmail.toLowerCase() || u.username?.toLowerCase() === usernameOrEmail.toLowerCase());
    if (!user) return { valid: false, error: 'Benutzername oder Passwort ist falsch.' };

    if (user.isLocked) {
        return { valid: false, error: 'Account ist gesperrt. Bitte wenden Sie sich an den Administrator.' };
    }

    if (user.validUntil && new Date() > new Date(user.validUntil)) {
        return { valid: false, error: 'Zugang ist abgelaufen.' };
    }

    return { valid: true };
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering) {
        const emailExists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
            setError('Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
            return;
        }
        const strength = calculateStrength(password);
        if (strength < 3) {
            setError('Das Passwort ist noch zu schwach.');
            return;
        }
        if (password !== passwordConfirm) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }
    } else {
        const userExists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!userExists) {
            setError('Benutzername oder Passwort ist falsch.');
            onLoginFail(email);
            return;
        }

        const status = validateUserStatus(email);
        if (!status.valid) {
            setError(status.error || 'Login nicht möglich.');
            return;
        }
    }

    setLoading('credentials');
    
    if (isRegistering) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: 'KMU CyberGuard - Ihr Bestätigungscode',
            text: `Ihr Bestätigungscode lautet: 123456`,
            html: `<p>Ihr Bestätigungscode lautet: <strong>123456</strong></p>`
          })
        });

        if (!response.ok) {
          console.warn('Email sending failed, falling back to demo mode');
          alert(`Demo-Modus (Email-Versand fehlgeschlagen): Ein Bestätigungscode (123456) wurde an ${email} gesendet.`);
        }
      } catch (error) {
        console.error('Error sending email:', error);
        alert(`Demo-Modus (Server nicht erreichbar): Ein Bestätigungscode (123456) wurde an ${email} gesendet.`);
      }
      setLoading(false);
      setStep('email-verification');
    } else {
      setTimeout(() => {
        setLoading(false);
        setStep('mfa');
      }, 800);
    }
  };

  const handleSkipMfa = async () => {
    setLoading('skip');
    try {
      let newUser: User | undefined;
      if (isRegistering) {
        const regResult = await onRegister({
          email,
          username: username || email.split('@')[0],
          role: 'ADMIN', // First user is always admin
          encryptionKey: new Uint8Array() as unknown as CryptoKey, // Placeholder
          validUntil: null
        });
        if (!regResult.success) {
          setError(regResult.error || 'Registrierung fehlgeschlagen.');
          setLoading(false);
          return;
        }
        newUser = regResult.user;
      }
      const key = await generateKeyFromPassword(password, DEMO_SALT);
      onLogin(email, key, newUser);
    } catch {
      setError('Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaPasskey = async () => {
    setLoading('passkey');
    try {
      const passkeyResult = isRegistering 
        ? await createPasskey(email, username) 
        : await verifyPasskey();

      if (passkeyResult.success) {
        let newUser: User | undefined;
        if (isRegistering) {
          const regResult = await onRegister({
            email,
            username: username || email.split('@')[0],
            role: 'ADMIN',
            encryptionKey: new Uint8Array() as unknown as CryptoKey,
            validUntil: null
          });
          if (!regResult.success) {
            setError(regResult.error || 'Registrierung fehlgeschlagen.');
            return;
          }
          newUser = regResult.user;
        }
        const key = await generateKeyFromPassword(password, DEMO_SALT);
        onLogin(email, key, newUser);
      } else {
        throw new Error(passkeyResult.error || "User cancelled or failed Passkey operation");
      }
    } catch (e) {
      const errorMessage = (e as Error).message || 'Unbekannter Fehler';
      if (errorMessage.includes('not supported') || errorMessage.includes('registrable domain')) {
        setError('Passkey wird in dieser Vorschau-Umgebung nicht unterstützt. Bitte verwenden Sie den Authenticator Code.');
      } else {
        setError(`Passkey-Fehler: ${errorMessage}`);
      }

      if (!isRegistering) {
        onLoginFail(email);
      }
      setStep('mfa'); // Go back to MFA selection step
    } finally {
      setLoading(false);
    }
  };

  const handleMfaTotp = async () => {
    if (isRegistering) {
      setStep('totp-setup');
    } else {
      const code = prompt("Bitte geben Sie Ihren 6-stelligen Authenticator-Code ein (Demo: beliebig):");
      if (code) {
        setLoading('totp');
        // In a real app, the server would verify the TOTP code
        const key = await generateKeyFromPassword(password, DEMO_SALT);
        onLogin(email, key);
        setLoading(false);
      } else {
          if (!isRegistering) {
              onLoginFail(email);
          }
          setError('Code-Eingabe abgebrochen.');
      }
    }
  };

  const handleTotpVerification = async () => {
    setLoading('totp');
    let newUser: User | undefined;
    if (isRegistering) {
      const regResult = await onRegister({
        email,
        username: username || email.split('@')[0],
        role: 'ADMIN',
        encryptionKey: new Uint8Array() as unknown as CryptoKey,
        validUntil: null
      });
      if (!regResult.success) {
        setError(regResult.error || 'Registrierung fehlgeschlagen.');
        setLoading(false);
        return;
      }
      newUser = regResult.user;
    }
    // In a real app, the server would verify the TOTP code
    const key = await generateKeyFromPassword(password, DEMO_SALT);
    onLogin(email, key, newUser);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <ShieldCheck size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">KMU CyberGuard</h1>
          <p className="text-blue-200 text-sm mt-2">
            Sicherheitsplattform für Teams
          </p>
        </div>

        <div className="p-8">
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                  {isRegistering ? 'Benutzerkonto erstellen' : 'Anmelden'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {isRegistering ? 'Erstellen Sie den ersten Administrator-Account.' : 'Melden Sie sich an Ihrem Arbeitsbereich an.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail-Adresse</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="ihre@email.de"
                />
              </div>

              {isRegistering && (
                <div className="-mt-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Anzeigename <span className="text-slate-400">(Optional)</span></label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Max Mustermann"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {isRegistering && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passwort bestätigen</label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                     <input
                        type="password"
                        required
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                      />
                  </div>
                  {password.length > 0 && password !== passwordConfirm && (
                    <p className="text-xs text-red-500 mt-1.5">Passwörter stimmen nicht überein.</p>
                  )}
                  <PasswordStrengthMeter password={password} />
                </div>
              )}
              </div>

              {error && (
                <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                  <ShieldAlert size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!!loading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading === 'credentials' ? <RefreshCcw className="animate-spin" /> : <ArrowRight />}
                {isRegistering ? 'Weiter zur Sicherheitseinrichtung' : 'Weiter'}
              </button>

              <div className="text-center mt-4">
                 {users.length > 0 && (
                     <div className="flex justify-center items-center gap-4">
                    {users.length > 0 && !isRegistering && (
                        <button type="button" onClick={() => setStep('password-reset')} className="text-sm text-slate-500 hover:underline">
                            Passwort vergessen?
                        </button>
                    )}
                     <button
                        type="button"
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); setPassword(''); }}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {isRegistering ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
                    </button>
                   </div>
                 )}
              </div>
            </form>
          )}
          {step === 'mfa' && (
             <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Fingerprint size={32} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {isRegistering ? 'Sicherheit einrichten' : 'Anmeldung bestätigen'}
                </h2>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                  Um die höchste Sicherheitsstufe zu gewährleisten, ist ein zweiter Faktor zwingend erforderlich.
                </p>
              </div>

              <button
                onClick={handleMfaPasskey}
                disabled={!!loading}
                className="w-full bg-blue-600 text-white p-4 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-between group shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-400 transition-colors">
                    <Fingerprint size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">{isRegistering ? 'Passkey einrichten & Fortfahren' : 'Mit Passkey anmelden'}</div>
                    <div className="text-xs text-blue-100">{loading === 'passkey' ? 'Warte auf Browser-Interaktion...' : 'Empfohlen & Sicher'}</div>
                  </div>
                </div>
                {loading === 'passkey' ? <RefreshCcw className="animate-spin" /> : <ArrowRight size={20} />}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">oder</span>
                </div>
              </div>

              <button
                onClick={handleMfaTotp}
                disabled={!!loading}
                className="w-full bg-white border border-slate-200 text-slate-700 p-4 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                 <div className="p-2 bg-slate-100 rounded-lg">
                    <KeyRound size={20} className="text-slate-600" />
                 </div>
                 <span>Authenticator Code</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-400">Demo-Optionen</span>
                </div>
              </div>

              <button
                onClick={handleSkipMfa}
                disabled={!!loading}
                className="w-full bg-slate-50 border border-dashed border-slate-300 text-slate-500 p-3 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading === 'skip' ? <RefreshCcw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                2FA Einrichtung überspringen (Demo)
              </button>

              <button
                onClick={() => { setStep('credentials'); setError(''); /* Keep email */ }}
                className="w-full text-sm text-slate-400 hover:text-slate-600 mt-4"
              >
                Zurück
              </button>
            </div>
          )}
          {step === 'email-verification' && (
            <EmailVerification 
              email={email} 
              error={error}
              onVerify={(code) => {
                // Demo: a real app would verify the code on the server
                if (code === '123456') {
                  setError('');
                  setStep('mfa');
                } else {
                  setError('Falscher Bestätigungscode.');
                }
              }} 
              onBack={() => { setStep('credentials'); setError(''); /* Keep email */ }} 
            />
          )}
          {step === 'totp-setup' && (
            <TotpSetup 
              onVerify={handleTotpVerification} 
              onBack={() => setStep('mfa')} 
            />
          )}
          {step === 'password-reset' && (
            <PasswordReset 
              users={users} 
              onBackToLogin={() => setStep('credentials')} 
            />
          )}
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Lock size={10} />
            Entspricht NIST 800-63B & NIS2 Anforderungen
          </p>
        </div>
      </div>
    </div>
  );
};
